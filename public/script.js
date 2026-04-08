// File upload: show filename when a file is selected
const uploadFilename = document.getElementById('upload-filename'); 
const resumeInput = document.getElementById('resume-file');

resumeInput.addEventListener('change', function () {
  const file = this.files[0];

  if (!file) return; // user cancelled the dialog

  // Check 1: Wrong file type
  if (file.type !== 'application/pdf') {
    showError('Only PDF files are accepted. Please upload a .pdf file.');
    this.value = ''; // clear the input
    return;
  }

  // Check 2: File too large (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_SIZE) {
    showError('File is too large. Maximum size is 5MB. Try compressing your PDF.');
    this.value = '';
    return;
  }

  // Check 3: File is empty (0 bytes)
  if (file.size === 0) {
    showError('The selected file is empty. Please choose a valid PDF.');
    this.value = '';
    return;
  }

  // All good — show filename
  uploadFilename.textContent = file.name;
  uploadFilename.style.display = 'block';
});
    
const generateBtn = document.getElementById("btn-generate");
const nameInput = document.getElementById("candidate-name");
const roleInput = document.getElementById("job-role");
const companyInput = document.getElementById("company-name");
const skillsInput = document.getElementById("key-skills");

const outputPanel = document.getElementById("output-panel");
const outputLetter = document.getElementById("output-letter");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");

generateBtn.addEventListener("click", handleGenerate);

async function handleGenerate(event) {
  event.preventDefault();

  // 1. Data Collection & Validation
  const name = nameInput.value.trim();
  const role = roleInput.value.trim();
  const company = companyInput.value.trim();
  const skills = skillsInput.value.trim();
  const pdfFile = document.getElementById('resume-file').files[0];

  if (!name || !role || !company || !skills ) {
    alert("Please fill in all fields.");
    return;
  }

  const resumeText = "";

   if (pdfFile) {
    try {
      resumeText = await extractPDFText(pdfFile);
      console.log("Extracted:", resumeText);
    } catch (err) {
      alert(err.message);
      return; // stop if extraction fails
    }
  }
  
  const newFormData = {
    name,
    role,
    company,
    skills,
    ...(resumeText && { resumeText })
  }


  // 2. UI Reset & Loading State
  showLoading(true);
  outputPanel.style.display = "none";
  emptyState.style.display = "none";
  generateBtn.disabled = true;

  try {
    const response = await fetch('/generate-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFormData),
    });

    // CRITICAL: Check if the server response is actually okay (200-299)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // 3. Display Result
      outputLetter.innerText = data.letter;
      outputPanel.style.display = "block";
      
      // OPTIONAL: Smooth scroll to the result so the user sees it immediately
      outputPanel.scrollIntoView({ behavior: 'smooth' });
    } else {
      throw new Error(data.error || "Unknown error occurred");
    }
    
  } catch (error) {
    console.error("Error generating letter:", error);
    // Be specific with the alert if possible
    alert(`Error: ${error.message}`);
    emptyState.style.display = "block";
  } finally {
    // 4. Cleanup
    showLoading(false);
    generateBtn.disabled = false;
  }
}

async function extractPDFText(file) {
  const formData = new FormData();
  formData.append('resume', file);

  let response;

  // Check 1: Network failure (server offline, no internet)
  try {
    response = await fetch('/extract-pdf', {
      method: 'POST',
      body: formData,
    });
  } catch (networkError) {
    throw new Error('Could not reach the server. Make sure it is running on localhost:3000.');
  }

  // Check 2: Server responded but with an error status
  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Server sent non-JSON error response
      errorMessage = `Server returned status ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  // Check 3: Response is not valid JSON
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Server returned an invalid response. Please try again.');
  }

  // Check 4: Success flag is false
  if (!data.success) {
    throw new Error(data.error || 'PDF extraction failed for unknown reason.');
  }

  // Check 5: Text came back empty after extraction
  if (!data.text || data.text.trim() === '') {
    throw new Error(
      'No text could be extracted from your PDF. ' +
      'This usually means it is a scanned or image-based PDF. ' +
      'Please export your resume from Word or Google Docs as a PDF and try again.'
    );
  }

  return data.text;
}



function generateMockLetter(name, role, company, skills) {
  return `Dear Hiring Manager,

I am writing to express my interest in the ${role} position at ${company}. My name is ${name}, and I believe my background and skills in ${skills} make me a strong candidate for this role.

I am eager to contribute my abilities and grow within your organization. Thank you for considering my application.

Sincerely,
${name}`;
}

function showLoading(isLoading) {
  loadingState.style.display = isLoading ? "flex" : "none";
}

const copyBtn = document.getElementById("btn-copy");
const copyText = document.getElementById("output-letter");
const btnText = document.getElementById("btn-copy-text");

copyBtn.addEventListener("click", function () {
  const text = outputLetter.innerText.trim();

  // Guard clause: Don't copy if empty
  if (!text) return;

  navigator.clipboard.writeText(text)
    .then(() => {     
      copyBtn.classList.add("copied");     
      btnText.innerText = "Copied!"; // Only changes the text, keeps the SVG
      
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        btnText.innerText = "Copy to Clipboard";
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
});
