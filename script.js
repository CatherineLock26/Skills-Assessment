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

document.getElementById("addQuestionBtn").addEventListener("click", addQuestion);

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

function addQuestion() {
  const category = prompt("Enter category:", "Digital Communication");
  const questionText = prompt("Enter the question:", "New question");

  const answer1Text = prompt("Enter answer 1 text:", "Option 1");
  const answer1Score = Number(prompt("Enter answer 1 score:", "0"));

  const answer2Text = prompt("Enter answer 2 text:", "Option 2");
  const answer2Score = Number(prompt("Enter answer 2 score:", "1"));

  const answer3Text = prompt("Enter answer 3 text:", "Option 3");
  const answer3Score = Number(prompt("Enter answer 3 score:", "2"));

  const answer4Text = prompt("Enter answer 4 text:", "Option 4");
  const answer4Score = Number(prompt("Enter answer 4 score:", "3"));

  const newQ = {
    id: Date.now(),
    category: category || "New Category",
    question: questionText || "New question",
    answers: [
      { text: answer1Text || "Option 1", score: isNaN(answer1Score) ? 0 : answer1Score },
      { text: answer2Text || "Option 2", score: isNaN(answer2Score) ? 1 : answer2Score },
      { text: answer3Text || "Option 3", score: isNaN(answer3Score) ? 2 : answer3Score },
      { text: answer4Text || "Option 4", score: isNaN(answer4Score) ? 3 : answer4Score }
    ]
  };

  questions.push(newQ);
  renderQuestions();
}



function deleteQuestion(id) {
  const index = questions.findIndex((q) => q.id === id);

  if (index !== -1) {
    questions.splice(index, 1);
    renderQuestions();
  }
}

function editQuestion(id) {
  const q = questions.find((q) => q.id === id);

  if (!q) return;

  const newCategory = prompt("Edit category:", q.category);
  const newQuestionText = prompt("Edit question:", q.question);

  const newAnswer1Text = prompt("Edit answer 1 text:", q.answers[0]?.text || "");
  const newAnswer1Score = Number(prompt("Edit answer 1 score:", q.answers[0]?.score ?? 0));

  const newAnswer2Text = prompt("Edit answer 2 text:", q.answers[1]?.text || "");
  const newAnswer2Score = Number(prompt("Edit answer 2 score:", q.answers[1]?.score ?? 1));

  const newAnswer3Text = prompt("Edit answer 3 text:", q.answers[2]?.text || "");
  const newAnswer3Score = Number(prompt("Edit answer 3 score:", q.answers[2]?.score ?? 2));

  const newAnswer4Text = prompt("Edit answer 4 text:", q.answers[3]?.text || "");
  const newAnswer4Score = Number(prompt("Edit answer 4 score:", q.answers[3]?.score ?? 3));

  q.category = newCategory || q.category;
  q.question = newQuestionText || q.question;
  q.answers = [
    { text: newAnswer1Text || q.answers[0]?.text || "Option 1", score: isNaN(newAnswer1Score) ? 0 : newAnswer1Score },
    { text: newAnswer2Text || q.answers[1]?.text || "Option 2", score: isNaN(newAnswer2Score) ? 1 : newAnswer2Score },
    { text: newAnswer3Text || q.answers[2]?.text || "Option 3", score: isNaN(newAnswer3Score) ? 2 : newAnswer3Score },
    { text: newAnswer4Text || q.answers[3]?.text || "Option 4", score: isNaN(newAnswer4Score) ? 3 : newAnswer4Score }
  ];

  renderQuestions();
}
