let currentQuestionIndex = 0;
let selectedScore = null;
let selectedAnswerText = "";
let totalScore = 0;
let currentUser = null;
let currentUserId = null;
let categoryScores = {};
let selectedAnswers = {};

const loginSection = document.getElementById("loginSection");
const resetPasswordSection = document.getElementById("resetPasswordSection");
const intro = document.getElementById("intro");
const quiz = document.getElementById("quiz");
const results = document.getElementById("results");
const userLoginBtn = document.getElementById("userLoginBtn");
const userLoginMessage = document.getElementById("userLoginMessage");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const clearSavedBtn = document.getElementById("clearSavedBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtnResults = document.getElementById("logoutBtnResults");
const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const progress = document.getElementById("progress");
const resultTitle = document.getElementById("resultTitle");
const scoreText = document.getElementById("scoreText");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const recommendations = document.getElementById("recommendations");
const answerReview = document.getElementById("answerReview");
const welcomeText = document.getElementById("welcomeText");

userLoginBtn.addEventListener("click", loginUser);
resetPasswordBtn.addEventListener("click", resetUserPassword);
startBtn.addEventListener("click", startAssessment);
logoutBtn.addEventListener("click", logoutUser);
logoutBtnResults.addEventListener("click", logoutUser);

nextBtn.addEventListener("click", () => {
  const currentQuestion = questions[currentQuestionIndex];
  totalScore += selectedScore;
  categoryScores[currentQuestion.category] = (categoryScores[currentQuestion.category] || 0) + selectedScore;
  selectedAnswers[currentQuestion.id] = {
    questionId: currentQuestion.id,
    question: currentQuestion.question,
    category: currentQuestion.category,
    selectedAnswer: selectedAnswerText,
    score: selectedScore
  };
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
});

restartBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  selectedScore = null;
  totalScore = 0;
  categoryScores = {};
  selectedAnswers = {};
  results.classList.add("hidden");
  intro.classList.remove("hidden");
});

clearSavedBtn.addEventListener("click", () => {
  localStorage.removeItem("latestAssessmentResult");
  alert("Latest saved result cleared.");
});

downloadPdfBtn.addEventListener("click", () => window.print());

document.addEventListener("DOMContentLoaded", () => {
  const savedUserId = sessionStorage.getItem("currentAssessmentUserId");
  if (savedUserId) {
    const user = getUsers().find((item) => item.id === Number(savedUserId));
    if (user) {
      setCurrentUser(user);
      showIntro();
    }
  }
});

function getUsers() {
  return JSON.parse(localStorage.getItem("assessmentUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("assessmentUsers", JSON.stringify(users));
}

function loginUser() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const users = getUsers();
  const user = users.find((item) => item.username.toLowerCase() === username.toLowerCase());

  if (!user || user.password !== password) {
    userLoginMessage.textContent = "Incorrect username or password.";
    return;
  }

  if (user.status === "Inactive") {
    userLoginMessage.textContent = "This account is inactive. Please contact an admin.";
    return;
  }

  setCurrentUser(user);
  sessionStorage.setItem("currentAssessmentUserId", user.id);

  if (user.mustResetPassword) {
    loginSection.classList.add("hidden");
    resetPasswordSection.classList.remove("hidden");
    resetPasswordMessage.textContent = "";
  } else {
    updateUserLastActive();
    showIntro();
  }
}

function setCurrentUser(user) {
  currentUser = user;
  currentUserId = user.id;
}

function resetUserPassword() {
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword.length < 6) {
    resetPasswordMessage.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (newPassword !== confirmPassword) {
    resetPasswordMessage.textContent = "Passwords do not match.";
    return;
  }

  const users = getUsers();
  const index = users.findIndex((user) => user.id === currentUserId);
  if (index === -1) return;

  users[index].password = newPassword;
  users[index].mustResetPassword = false;
  users[index].lastActive = new Date().toISOString();
  saveUsers(users);
  setCurrentUser(users[index]);
  showIntro();
}

function updateUserLastActive() {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === currentUserId);
  if (index >= 0) {
    users[index].lastActive = new Date().toISOString();
    saveUsers(users);
    setCurrentUser(users[index]);
  }
}

function showIntro() {
  loginSection.classList.add("hidden");
  resetPasswordSection.classList.add("hidden");
  quiz.classList.add("hidden");
  results.classList.add("hidden");
  intro.classList.remove("hidden");
  welcomeText.textContent = `Welcome, ${currentUser.name || currentUser.username}`;
}

function logoutUser() {
  sessionStorage.removeItem("currentAssessmentUserId");
  currentUser = null;
  currentUserId = null;
  currentQuestionIndex = 0;
  selectedScore = null;
  totalScore = 0;
  categoryScores = {};
  selectedAnswers = {};
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  intro.classList.add("hidden");
  quiz.classList.add("hidden");
  results.classList.add("hidden");
  resetPasswordSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
}

function startAssessment() {
  if (!currentUser) return;
  currentQuestionIndex = 0;
  selectedScore = null;
  totalScore = 0;
  categoryScores = {};
  selectedAnswers = {};
  intro.classList.add("hidden");
  results.classList.add("hidden");
  quiz.classList.remove("hidden");
  showQuestion();
}

function showQuestion() {
  selectedScore = null;
  selectedAnswerText = "";
  nextBtn.disabled = true;
  const currentQuestion = questions[currentQuestionIndex];
  progress.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  questionText.textContent = currentQuestion.question;
  answersDiv.innerHTML = "";

    // RANDOMISE ANSWERS
  const shuffledAnswers = shuffleArray([...currentQuestion.answers]);

  shuffledAnswers.forEach((answer) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = answer.text;
    button.addEventListener("click", () => {
      document.querySelectorAll(".answer-btn").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
      selectedScore = answer.score;
      selectedAnswerText = answer.text;
      nextBtn.disabled = false;
    });
    answersDiv.appendChild(button);
  });
}

function getLevel(score) {
  const maxScore = questions.length * 3;
  const percentage = maxScore ? (score / maxScore) * 100 : 0;
  if (percentage < 35) return "Beginner";
  if (percentage < 60) return "Developing";
  if (percentage < 80) return "Proficient";
  return "Advanced";
}

function getRecommendations(level, categoryScores) {
  const categoryQuestionCounts = questions.reduce((counts, question) => {
    counts[question.category] = (counts[question.category] || 0) + 1;
    return counts;
  }, {});

  const categoryAdvice = {
    "Digital Communication": "Practise professional email writing, video call etiquette, and using collaboration tools such as Teams or Zoom.",
    "Productivity Tools": "Build confidence with spreadsheets, formulas, filters, charts, and document formatting.",
    "Online Safety": "Review password safety, phishing warning signs, privacy settings, and safe browsing habits.",
    "Digital Problem Solving": "Practise troubleshooting, searching for reliable help, and solving common device or software issues.",
    "Data Handling": "Focus on organising data, checking accuracy, using simple analysis, and presenting findings clearly."
  };

  const sortedCategories = Object.entries(categoryQuestionCounts)
    .map(([category, count]) => {
      const score = categoryScores[category] || 0;
      const max = count * 3;
      const percentage = max ? score / max : 0;
      return { category, score, max, percentage };
    })
    .sort((a, b) => a.percentage - b.percentage);

  const weakestCategories = sortedCategories.filter((item) => item.percentage < 0.67).slice(0, 3);
  const strongestCategory = [...sortedCategories].sort((a, b) => b.percentage - a.percentage)[0];

  const levelAdvice = {
    Beginner: "Start with the core digital skills you use every day, then practise one area at a time.",
    Developing: "You have a useful foundation. Focus on consistency and confidence across your weaker areas.",
    Proficient: "You are doing well. Strengthen advanced tasks and look for ways to work faster and more independently.",
    Advanced: "You are operating at a high level. Consider mentoring others or leading digital improvement activities."
  };

  const items = [`<li>${levelAdvice[level]}</li>`];

  weakestCategories.forEach((item) => {
    items.push(`<li><strong>${escapeHtml(item.category)}:</strong> ${escapeHtml(categoryAdvice[item.category] || "Spend extra practice time on this area and use short tutorials or guided exercises.")}</li>`);
  });

  if (strongestCategory) {
    items.push(`<li><strong>Strength to build on:</strong> ${escapeHtml(strongestCategory.category)} is your strongest area based on this assessment.</li>`);
  }

  items.push("<li>Next step: choose one recommendation and practise it for 15 minutes a day this week.</li>");
  return `<ul>${items.join("")}</ul>`;
}

function showResults() {
  quiz.classList.add("hidden");
  results.classList.remove("hidden");

  const userName = currentUser.name || currentUser.username;
  const level = getLevel(totalScore);
  const maxScore = questions.length * 3;

  const groupCourse = currentUser.groupCourse || "Unassigned";

  resultTitle.textContent = `${userName}, your digital skills level is: ${level}`;
  scoreText.textContent = `Total score: ${totalScore} out of ${maxScore} | Group/Course: ${groupCourse}`;
  recommendations.innerHTML = getRecommendations(level, categoryScores);

  categoryBreakdown.innerHTML = "<h3>Category breakdown</h3>";
  Object.entries(categoryScores).forEach(([category, score]) => {
    const p = document.createElement("p");
    p.textContent = `${category}: ${score}`;
    categoryBreakdown.appendChild(p);
  });

  answerReview.innerHTML = "<h3>Question and Answer Review</h3>";
  const reviewList = document.createElement("ol");
  questions.forEach((question) => {
    const response = selectedAnswers[question.id];
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(question.question)}</strong><br>
      <span>Category: ${escapeHtml(question.category)}</span><br>
      <span>Selected answer: ${escapeHtml(response?.selectedAnswer || "No answer recorded")}</span><br>
      <span>Score: ${response?.score ?? 0}</span>
    `;
    reviewList.appendChild(li);
  });
  answerReview.appendChild(reviewList);

  const resultData = {
    id: Date.now(),
    userId: currentUserId,
    userName,
    username: currentUser.username,
    groupCourse,
    totalScore,
    maxScore,
    level,
    categoryScores,
    answers: Object.values(selectedAnswers),
    recommendations: recommendations.innerText,
    completedAt: new Date().toISOString()
  };

  localStorage.setItem("latestAssessmentResult", JSON.stringify(resultData));
  const existingResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  existingResults.push(resultData);
  localStorage.setItem("allAssessmentResults", JSON.stringify(existingResults));
  updateUserLastActive();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}
