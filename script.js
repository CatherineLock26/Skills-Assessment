//variables
let currentQuestionIndex = 0;
let selectedScore = null;
let totalScore = 0;
let userName = "";
let categoryScores = {};

//html elements
const intro = document.getElementById("intro");
const quiz = document.getElementById("quiz");
const results = document.getElementById("results");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const progress = document.getElementById("progress");

const resultTitle = document.getElementById("resultTitle");
const scoreText = document.getElementById("scoreText");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const recommendations = document.getElementById("recommendations");

//adding local storage
const clearSavedBtn = document.getElementById("clearSavedBtn");

//download to PDF
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

//Admin Dashboard
const viewAdminBtn = document.getElementById("viewAdminBtn");
const adminPanel = document.getElementById("adminPanel");
const adminSummary = document.getElementById("adminSummary");
const resultsTable = document.getElementById("resultsTable");

//start assessment
startBtn.addEventListener("click", () => {
  userName = document.getElementById("userName").value.trim() || "User";
  intro.classList.add("hidden");
  quiz.classList.remove("hidden");
  showQuestion();
});

 //show question
function showQuestion() {
  selectedScore = null;
  nextBtn.disabled = true;

  const currentQuestion = questions[currentQuestionIndex];
  progress.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  questionText.textContent = currentQuestion.question;
  answersDiv.innerHTML = "";

  currentQuestion.answers.forEach(answer => {
    const button = document.createElement("button");
    button.classList.add("answer-btn");
    button.textContent = answer.text;

    button.addEventListener("click", () => {
      document.querySelectorAll(".answer-btn").forEach(btn => btn.classList.remove("selected"));
      button.classList.add("selected");
      selectedScore = answer.score;
      nextBtn.disabled = false;
    });

    answersDiv.appendChild(button);
  });
}

//save answers and move on
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

//calculate level
function getLevel(score) {
  if (score <= 15) return "Beginner";
  if (score <= 30) return "Developing";
  if (score <= 45) return "Proficient";
  return "Advanced";
}

//show results
function showResults() {
  quiz.classList.add("hidden");
  results.classList.remove("hidden");

  const level = getLevel(totalScore);

  resultTitle.textContent = `${userName}, your digital skills level is: ${level}`;
  scoreText.textContent = `Total score: ${totalScore} out of 60`;

  categoryBreakdown.innerHTML = "<h3>Category Breakdown</h3>";
  for (const category in categoryScores) {
    const p = document.createElement("p");
    p.textContent = `${category}: ${categoryScores[category]}`;
    categoryBreakdown.appendChild(p);
  }

  recommendations.innerHTML = `<h3>Recommendations</h3><p>${getRecommendation(level)}</p>`;
  
//adding local storage
  const resultData = {
  userName,
  totalScore,
  level,
  categoryScores,
  completedAt: new Date().toISOString()
};

 localStorage.setItem("latestAssessmentResult", JSON.stringify(resultData)); 
  
  //admin Dashboard
  const existingResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  existingResults.push(resultData);
  localStorage.setItem("allAssessmentResults", JSON.stringify(existingResults));

}

//recommendations 
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

//restart logic
restartBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  selectedScore = null;
  totalScore = 0;
  categoryScores = {};

  results.classList.add("hidden");
  intro.classList.remove("hidden");
});

//Clear button
clearSavedBtn.addEventListener("click", () => {
  localStorage.removeItem("latestAssessmentResult");
  alert("Saved result cleared.");
});

//page-load check
document.addEventListener("DOMContentLoaded", () => {
  const savedResult = localStorage.getItem("latestAssessmentResult");

  if (savedResult) {
    const parsed = JSON.parse(savedResult);
    console.log("Saved result found:", parsed);
  }
});

//download to PDF
downloadPdfBtn.addEventListener("click", () => {
  window.print();
});

//admin dashboard
viewAdminBtn.addEventListener("click", () => {
  const results = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  adminPanel.classList.remove("hidden");

  const averageScore = results.length
    ? (results.reduce((sum, r) => sum + r.totalScore, 0) / results.length).toFixed(1)
    : 0;

  adminSummary.innerHTML = `
    <p>Total assessments completed: ${results.length}</p>
    <p>Average score: ${averageScore}</p>
  `;

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

  results.forEach(result => {
    html += `
      <tr>
        <td>${result.userName}</td>
        <td>${result.totalScore}</td>
        <td>${result.level}</td>
        <td>${new Date(result.completedAt).toLocaleString()}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  resultsTable.innerHTML = html;
});

function renderQuestions(){
  const list = document.getElementById("questionList");
  list.inner="";

  questions.forEach(q =>{
    const div = document.createElement("div");
    div.innerHTML="
      <p>${q.question}</p>
      <button onclick="editQuestion(${q.id})">Edit</button>
      <button onclick="deleteQuestion(${q.id})">Delete</button>
    ";
    list.appendChild(div);
});
}

function addQuestion(){
  const newQ = (
    id:Date.noew(),
    category:"New Category",
    question:"New question",
    answers[]
};
questions.push(newQ);
renderQuestions()
}

document.getElementById("addQuestionBtn").addEventListener("click", AddQuestion);

function deleteQuestion(){
  const index = questions.findIndex(q=>q.id===id);
  if(index!==-1{
    questions.splice(index,1);
    renderQuestions();
  }
}
