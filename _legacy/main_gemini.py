import os
import json
import base64
from pathlib import Path
from pdf2image import convert_from_path
from google import genai
from google.genai import types
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ===== DEBUG & FORMATTING =====
class DebugFormatter:
    """Console output formatter with colors and styles"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    
    @staticmethod
    def print_header(text):
        print(f"\n{DebugFormatter.BOLD}{DebugFormatter.HEADER}{'='*60}")
        print(f"  {text.upper()}")
        print(f"{'='*60}{DebugFormatter.ENDC}\n")
    
    @staticmethod
    def print_step(step_num, step_name, status=""):
        status_text = f" [{DebugFormatter.GREEN}✓{DebugFormatter.ENDC}]" if status == "done" else ""
        print(f"{DebugFormatter.CYAN}[STEP {step_num}]{DebugFormatter.ENDC} {step_name}{status_text}")
    
    @staticmethod
    def print_info(msg):
        print(f"{DebugFormatter.BLUE}ℹ{DebugFormatter.ENDC}  {msg}")
    
    @staticmethod
    def print_success(msg):
        print(f"{DebugFormatter.GREEN}✓{DebugFormatter.ENDC}  {msg}")
    
    @staticmethod
    def print_warning(msg):
        print(f"{DebugFormatter.YELLOW}⚠{DebugFormatter.ENDC}  {msg}")
    
    @staticmethod
    def print_error(msg):
        print(f"{DebugFormatter.RED}✗{DebugFormatter.ENDC}  {msg}")
    
    @staticmethod
    def print_llm_response(title, text, max_lines=5):
        """Display LLM response in a formatted box"""
        print(f"\n{DebugFormatter.BOLD}{DebugFormatter.YELLOW}📄 {title}:{DebugFormatter.ENDC}")
        lines = text.strip().split('\n')[:max_lines]
        for line in lines:
            preview = line[:100] + "..." if len(line) > 100 else line
            print(f"  {preview}")
        if len(text.strip().split('\n')) > max_lines:
            print(f"  {DebugFormatter.YELLOW}... (truncated){DebugFormatter.ENDC}")
    
    @staticmethod
    def print_progress_bar(current, total, prefix="Progress"):
        """Display a nice progress bar"""
        percentage = current / total
        filled = int(30 * percentage)
        bar = f"█" * filled + f"░" * (30 - filled)
        percent = f"{percentage * 100:.1f}%"
        print(f"\r{DebugFormatter.CYAN}{prefix}: |{bar}| {percent}{DebugFormatter.ENDC}", end="", flush=True)
        if current == total:
            print()  # New line when complete

# ===== CONFIG =====
CV_FOLDER = "cvs"
IMAGE_FOLDER = "images"
OUTPUT_FOLDER = "outputs"

# Matching rules
REQUIRED_SKILLS = ["python", "excel", "communication"]
MIN_EXPERIENCE = 1

# Model - Using Gemini Flash (latest)
LLM_MODEL = "gemini-3-flash-preview"

# ==================

os.makedirs(IMAGE_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Initialize Gemini client
api_key = os.getenv("GOOGLE_AI_STUDIO_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_AI_STUDIO_API_KEY not found in environment variables")

client = genai.Client(api_key=api_key)


def pdf_to_images(pdf_path):
    """
    Convert a PDF into PNG images (one per page)
    """
    DebugFormatter.print_step(1, "Converting PDF to Images")
    pages = convert_from_path(pdf_path, dpi=300)
    image_paths = []
    DebugFormatter.print_info(f"Found {len(pages)} page(s) in PDF")

    for i, page in enumerate(pages):
        img_path = os.path.join(
            IMAGE_FOLDER,
            f"{Path(pdf_path).stem}_{i}.png"
        )
        page.save(img_path, "PNG")
        image_paths.append(img_path)
        DebugFormatter.print_progress_bar(i + 1, len(pages), prefix="  PDF Conversion")

    DebugFormatter.print_success(f"Generated {len(image_paths)} image(s)")
    return image_paths


def encode_image(path):
    """
    Read and base64 encode an image so we can send it to Gemini.
    """
    with open(path, "rb") as f:
        img_bytes = f.read()
    return base64.b64encode(img_bytes).decode("utf-8")


def run_ocr_on_images(image_files):
    """
    Sends images one by one to Gemini for OCR (text extraction)
    """
    DebugFormatter.print_step(2, "Running OCR on Images using Gemini")
    full_text = ""
    for idx, img in enumerate(image_files):
        DebugFormatter.print_info(f"Processing image {idx + 1}/{len(image_files)}: {Path(img).name}")
        
        # Read image and encode to base64
        with open(img, "rb") as f:
            image_bytes = f.read()
        
        # Send to Gemini for OCR
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=[
                "Extract all text from this image. Extract everything, including text on the sides and margins. Be thorough.",
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type='image/png',
                )
            ]
        )

        ocr_text = response.text
        full_text += ocr_text + "\n"
        DebugFormatter.print_llm_response(f"OCR Result (Page {idx + 1})", ocr_text, max_lines=3)
        
        # Save the full text 
        out_path = os.path.join(OUTPUT_FOLDER, f"{Path(img).stem}.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(full_text)
        DebugFormatter.print_progress_bar(idx + 1, len(image_files), prefix="  OCR Processing")
    
    DebugFormatter.print_success(f"OCR completed. Extracted {len(full_text)} characters")
    return full_text


def ask_llm_to_structure(cv_text):
    """
    Send the full extracted text to Gemini for JSON structuring
    """
    DebugFormatter.print_step(3, "Structuring CV with Gemini Flash")
    DebugFormatter.print_info(f"Sending {len(cv_text)} characters to {LLM_MODEL} model...")
    
    prompt = f"""Extract structured information from this CV and return STRICT JSON format.

Return ONLY valid JSON without any markdown or extra text. JSON format:

{{
"name": "",
"skills": [],
"experience_years": 0,
"education_level": "",
"languages": [],
"strengths": "",
"weaknesses": "",
"risk_level": "Low"
}}

CV TEXT:
{cv_text}"""

    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=prompt
    )

    llm_output = response.text
    DebugFormatter.print_llm_response(f"LLM Response from {LLM_MODEL}", llm_output, max_lines=8)
    return llm_output


def safe_parse_json(raw):
    """
    Extract JSON from LLM output if there is extra text
    """
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON found in response")
    return json.loads(raw[start:end])


def compute_simple_score(profile):
    """
    Compute a simple matching score
    """
    DebugFormatter.print_step(4, "Computing Compatibility Score")
    skills = [s.lower() for s in profile.get("skills", [])]
    exp = profile.get("experience_years", 0)

    matched = sum(1 for s in REQUIRED_SKILLS if s in skills)
    skill_score = matched / len(REQUIRED_SKILLS)

    bonus = 1 if exp >= MIN_EXPERIENCE else 0
    final_score = int((skill_score * 0.8 + bonus * 0.2) * 100)

    profile["compatibility_score"] = final_score
    if final_score < 40:
        profile["risk_level"] = "High"
    elif final_score < 70:
        profile["risk_level"] = "Medium"
    else:
        profile["risk_level"] = "Low"

    DebugFormatter.print_info(f"Name: {profile.get('name', 'N/A')}")
    DebugFormatter.print_info(f"Skills: {', '.join(skills) if skills else 'None found'}")
    DebugFormatter.print_info(f"Experience: {exp} years")

    DebugFormatter.print_info(f"Company Required Skills: {REQUIRED_SKILLS}")
    DebugFormatter.print_info(f"Matched Required Skills: {matched}/{len(REQUIRED_SKILLS)}")
    DebugFormatter.print_success(f"Compatibility Score: {final_score}% - Risk Level: {profile['risk_level']}")

    return profile


def process_all_cvs():
    DebugFormatter.print_header("CV Processing Pipeline Started (Gemini Flash)")
    
    pdf_files = [f for f in os.listdir(CV_FOLDER) if f.lower().endswith(".pdf")]
    total_files = len(pdf_files)
    
    if total_files == 0:
        DebugFormatter.print_warning(f"No PDF files found in {CV_FOLDER} folder")
        return
    
    DebugFormatter.print_info(f"Found {total_files} PDF file(s) to process")
    
    for file_idx, file in enumerate(pdf_files, 1):
        DebugFormatter.print_header(f"Processing File {file_idx}/{total_files}: {file}")
        start_time = time.time()

        try:
            pdf_path = os.path.join(CV_FOLDER, file)
            images = pdf_to_images(pdf_path)

            # 1️⃣ OCR all pages using Gemini
            extracted_text = run_ocr_on_images(images)

            # 2️⃣ Structure using Gemini Flash
            llm_output = ask_llm_to_structure(extracted_text)

            # 3️⃣ Parse JSON
            try:
                DebugFormatter.print_step(5, "Parsing JSON Response")
                profile = safe_parse_json(llm_output)
                DebugFormatter.print_success("JSON parsed successfully")
            except Exception as e:
                DebugFormatter.print_error(f"Failed to parse JSON: {e}")
                DebugFormatter.print_info(f"Raw response: {llm_output[:200]}")
                continue

            # 4️⃣ Score
            scored = compute_simple_score(profile)

            # 5️⃣ Save
            DebugFormatter.print_step(6, "Saving Results")
            out_path = os.path.join(OUTPUT_FOLDER, f"{Path(file).stem}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(scored, f, indent=2)

            elapsed_time = time.time() - start_time
            DebugFormatter.print_success(f"Saved → {out_path}")
            DebugFormatter.print_info(f"Processing time: {elapsed_time:.2f}s")
        
        except Exception as e:
            DebugFormatter.print_error(f"Error processing {file}: {str(e)}")
            continue
    
    DebugFormatter.print_header(f"✓ All {total_files} file(s) processed successfully!")


if __name__ == "__main__":
    try:
        process_all_cvs()
    except Exception as e:
        DebugFormatter.print_error(f"Fatal error: {str(e)}")
        raise
