let currentQuestionIndex = 0;
let selectedScore = null;
let totalScore = 0;
let userName = "";
let categoryScores = {};

const intro = document.getElementById("intro");
const quiz = document.getElementById("quiz");
const results = document.getElementById("results");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const clearSavedBtn = document.getElementById("clearSavedBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const progress = document.getElementById("progress");

const resultTitle = document.getElementById("resultTitle");
const scoreText = document.getElementById("scoreText");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const recommendations = document.getElementById("recommendations");

document.addEventListener("DOMContentLoaded", () => {
  const savedQuestions = localStorage.getItem("questionsData");
  if (savedQuestions) {
    questions = JSON.parse(savedQuestions);
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      userName = document.getElementById("userName").value.trim() || "User";
      currentQuestionIndex = 0;
      selectedScore = null;
      totalScore = 0;
      categoryScores = {};

      intro.classList.add("hidden");
      results.classList.add("hidden");
      quiz.classList.remove("hidden");

      showQuestion();
    });
  }

  if (nextBtn) {
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
  }
//currently same as nextBtn
  if (previousBtn) {
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
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      currentQuestionIndex = 0;
      selectedScore = null;
      totalScore = 0;
      categoryScores = {};

      results.classList.add("hidden");
      intro.classList.remove("hidden");
    });
  }

  if (clearSavedBtn) {
    clearSavedBtn.addEventListener("click", () => {
      localStorage.removeItem("latestAssessmentResult");
      alert("Latest saved result cleared.");
    });
  }

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      window.print();
    });
  }
});

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

function getLevel(score) {
  if (score <= 15) return "Beginner";
  if (score <= 30) return "Developing";
  if (score <= 45) return "Proficient";
  return "Advanced";
}

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

function showResults() {
  quiz.classList.add("hidden");
  results.classList.remove("hidden");

  const level = getLevel(totalScore);
  const maxScore = questions.length * 3;

  resultTitle.textContent = `${userName}, your digital skills level is: ${level}`;
  scoreText.textContent = `Total score: ${totalScore} out of ${maxScore}`;
  recommendations.textContent = getRecommendation(level);

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
}