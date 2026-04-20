// Variables
let currentQuestionIndex = 0;
let selectedScore = null;
let totalScore = 0;
let userName = "";
let categoryScores = {};

// HTML elements
const intro = document.getElementById("intro");
const quiz = document.getElementById("quiz");
const results = document.getElementById("results");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const clearSavedBtn = document.getElementById("clearSavedBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const viewAdminBtn = document.getElementById("viewAdminBtn");

const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const progress = document.getElementById("progress");

const resultTitle = document.getElementById("resultTitle");
const scoreText = document.getElementById("scoreText");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const recommendations = document.getElementById("recommendations");

const adminPanel = document.getElementById("adminPanel");
const adminSummary = document.getElementById("adminSummary");
const resultsTable = document.getElementById("resultsTable");



// Download to PDF
downloadPdfBtn.addEventListener("click", () => {
  window.print();
});

// Start assessment
startBtn.addEventListener("click", () => {
  userName = document.getElementById("userName").value.trim() || "User";
  currentQuestionIndex = 0;
  selectedScore = null;
  totalScore = 0;
  categoryScores = {};

  intro.classList.add("hidden");
  results.classList.add("hidden");
  //adminPanel.classList.add("hidden");
  quiz.classList.remove("hidden");

  showQuestion();
});

// Save answers and move on
nextBtn.addEventListener("click", () => {
  const currentQuestion = questions[currentQuestionIndex];
  totalScore += selectedScore;

  if (!categoryScores[currentQuestion.category]) {
    categoryScores[currentQuestion.category] = 0;
  }

  categoryScores[currentQuestion.category] += selectedScore;
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
});

// Restart
restartBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  selectedScore = null;
  totalScore = 0;
  categoryScores = {};

  results.classList.add("hidden");
  adminPanel.classList.add("hidden");
  intro.classList.remove("hidden");
});

// Clear saved result
clearSavedBtn.addEventListener("click", () => {
  localStorage.removeItem("latestAssessmentResult");
  alert("Latest saved result cleared.");
});

// View admin dashboard
viewAdminBtn.addEventListener("click", () => {
  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  adminPanel.classList.remove("hidden");

  const averageScore = savedResults.length
    ? (savedResults.reduce((sum, r) => sum + r.totalScore, 0) / savedResults.length).toFixed(1)
    : 0;

  adminSummary.innerHTML = `
    <p>Total assessments completed: ${savedResults.length}</p>
    <p>Average score: ${averageScore}</p>
  `;

  if (savedResults.length === 0) {
    resultsTable.innerHTML = "<p>No saved results yet.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Score</th>
          <th>Level</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  savedResults.forEach((result) => {
    html += `
      <tr>
        <td>${result.userName}</td>
        <td>${result.totalScore}</td>
        <td>${result.level}</td>
        <td>${new Date(result.completedAt).toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  resultsTable.innerHTML = html;
});

// Page-load check
document.addEventListener("DOMContentLoaded", () => {
  const savedResult = localStorage.getItem("latestAssessmentResult");
  if (savedResult) {
    console.log("Saved result found:", JSON.parse(savedResult));
  }
  const savedQuestions = localStorage.getItem("questionsData");
  if (savedQuestions) {
    questions = JSON.parse(savedQuestions);
  }
  renderQuestions();
  
});

// Show question
function showQuestion() {
  selectedScore = null;
  nextBtn.disabled = true;

  const currentQuestion = questions[currentQuestionIndex];
  progress.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  questionText.textContent = currentQuestion.question;
  answersDiv.innerHTML = "";

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.classList.add("answer-btn");
    button.textContent = answer.text;

    button.addEventListener("click", () => {
      document.querySelectorAll(".answer-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });

      button.classList.add("selected");
      selectedScore = answer.score;
      nextBtn.disabled = false;
    });

    answersDiv.appendChild(button);
  });
}

// Calculate level
function getLevel(score) {
  if (score <= 15) return "Beginner";
  if (score <= 30) return "Developing";
  if (score <= 45) return "Proficient";
  return "Advanced";
}

// Recommendations
function getRecommendation(level) {
  if (level === "Beginner") {
    return "Focus on core digital skills such as email, online collaboration, file management, and safe internet use.";
  }
  if (level === "Developing") {
    return "Build confidence in spreadsheets, digital communication, and creative tools through guided practice.";
  }
  if (level === "Proficient") {
    return "Strengthen advanced skills such as data analysis, digital content creation, and workflow automation.";
  }
  return "You are operating at an advanced level. Consider leadership, mentoring, and digital strategy development opportunities.";
}

// Show results
function showResults() {
  quiz.classList.add("hidden");
  results.classList.remove("hidden");

  const level = getLevel(totalScore);
  const maxScore = questions.length * 3;

  resultTitle.textContent = `${userName}, your digital skills level is: ${level}`;
  scoreText.textContent = `Total score: ${totalScore} out of ${maxScore}`;

viewAdminBtn.addEventListener("click", () => {
  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  adminPanel.classList.remove("hidden");

  const averageScore = savedResults.length
    ? (savedResults.reduce((sum, r) => sum + r.totalScore, 0) / savedResults.length).toFixed(1)
    : 0;

  adminSummary.innerHTML = `
    <p>Total assessments completed: ${savedResults.length}</p>
    <p>Average score: ${averageScore}</p>
  `;

  if (savedResults.length === 0) {
    resultsTable.innerHTML = "<p>No saved results yet.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Score</th>
          <th>Level</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  savedResults.forEach((result) => {
    html += `
      <tr>
        <td>${result.userName}</td>
        <td>${result.totalScore}</td>
        <td>${result.level}</td>
        <td>${new Date(result.completedAt).toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  resultsTable.innerHTML = html;

  renderQuestions();
});

  const resultData = {
    userName,
    totalScore,
    level,
    categoryScores,
    completedAt: new Date().toISOString()
  };

  localStorage.setItem("latestAssessmentResult", JSON.stringify(resultData));

  const existingResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  existingResults.push(resultData);
  localStorage.setItem("allAssessmentResults", JSON.stringify(existingResults));

  console.log("Saved latest result:", resultData);
  console.log("All saved results:", JSON.parse(localStorage.getItem("allAssessmentResults")));
}


function renderQuestions() {
  const list = document.getElementById("questionList");
  list.innerHTML = "";

  questions.forEach((q) => {
    const div = document.createElement("div");
    div.classList.add("question-item");

    const answersHtml = q.answers
      .map((answer) => `<li>${answer.text} (Score: ${answer.score})</li>`)
      .join("");

    div.innerHTML = `
      <p><strong>Category:</strong> ${q.category}</p>
      <p><strong>Question:</strong> ${q.question}</p>
      <ul>${answersHtml}</ul>
      <button onclick="editQuestion(${q.id})">Edit</button>
      <button onclick="deleteQuestion(${q.id})">Delete</button>
      <hr>
    `;

    list.appendChild(div);
  });

  localStorage.setItem("questionsData", JSON.stringify(questions));
}
