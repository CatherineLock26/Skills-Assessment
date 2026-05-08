let currentQuestionIndex = 0;
let selectedScore = null;
let selectedAnswerText = "";
let totalScore = 0;
let currentProfile = null;
let categoryScores = {};
let selectedAnswers = [];
let assessmentQuestions = [];

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
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", resetAssessment);
downloadPdfBtn.addEventListener("click", () => window.print());
logoutBtn.addEventListener("click", logoutUser);
logoutBtnResults.addEventListener("click", logoutUser);

document.addEventListener("DOMContentLoaded", checkExistingSession);

async function checkExistingSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  currentProfile = await getProfile();
  afterLogin();
}

async function loginUser() {
  userLoginMessage.textContent = "";
  const loginIdentifier = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!loginIdentifier || !password) return userLoginMessage.textContent = "Enter your username/email and password.";

  const { error } = await sb.auth.signInWithPassword({ email: loginIdentifierToEmail(loginIdentifier), password });
  if (error) return userLoginMessage.textContent = `Login failed: ${error.message}`;

  try {
    currentProfile = await getProfile();
  } catch (profileError) {
    await sb.auth.signOut();
    return userLoginMessage.textContent = "Login worked, but no matching profile row was found. Contact your administrator.";
  }
  if (currentProfile.role === "admin") {
    await sb.auth.signOut();
    return userLoginMessage.textContent = "Please use the admin dashboard for admin accounts.";
  }
  if (currentProfile.status !== "active") {
    await sb.auth.signOut();
    return userLoginMessage.textContent = "This account is inactive. Contact your administrator.";
  }
  afterLogin();
}

function afterLogin() {
  hide(loginSection);
  hide(results);
  hide(quiz);
  if (currentProfile.must_reset_password) {
    show(resetPasswordSection);
    hide(intro);
  } else {
    hide(resetPasswordSection);
    welcomeText.textContent = `Welcome, ${currentProfile.display_name || currentProfile.username}`;
    show(intro);
  }
}

async function resetUserPassword() {
  resetPasswordMessage.textContent = "";
  const password = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;
  if (password.length < 8) return resetPasswordMessage.textContent = "Password must be at least 8 characters.";
  if (password !== confirm) return resetPasswordMessage.textContent = "Passwords do not match.";

  const { error: authError } = await sb.auth.updateUser({ password });
  if (authError) return resetPasswordMessage.textContent = authError.message;
  const { error } = await sb.from("profiles").update({ must_reset_password: false }).eq("id", currentProfile.id);
  if (error) return resetPasswordMessage.textContent = error.message;
  currentProfile.must_reset_password = false;
  afterLogin();
}

async function loadQuestions() {
  const { data, error } = await sb
    .from("questions")
    .select("id, category, question, display_order, answers(id, answer_text, score, display_order)")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("display_order", { foreignTable: "answers", ascending: true });
  if (error) throw error;
  assessmentQuestions = (data || []).map(q => ({
    id: q.id,
    category: q.category,
    question: q.question,
    answers: (q.answers || []).map(a => ({ id: a.id, text: a.answer_text, score: a.score }))
  }));
}

async function startAssessment() {
  await loadQuestions();
  if (!assessmentQuestions.length) return alert("No questions are available yet.");
  resetAssessmentState();
  hide(intro);
  show(quiz);
  showQuestion();
}

function resetAssessmentState() {
  currentQuestionIndex = 0;
  selectedScore = null;
  selectedAnswerText = "";
  totalScore = 0;
  categoryScores = {};
  selectedAnswers = [];
}

function resetAssessment() {
  resetAssessmentState();
  hide(results);
  show(intro);
}

function showQuestion() {
  selectedScore = null;
  selectedAnswerText = "";
  nextBtn.disabled = true;
  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  progress.textContent = `Question ${currentQuestionIndex + 1} of ${assessmentQuestions.length}`;
  questionText.textContent = currentQuestion.question;
  answersDiv.innerHTML = "";

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

async function nextQuestion() {
  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  totalScore += selectedScore;
  categoryScores[currentQuestion.category] = (categoryScores[currentQuestion.category] || 0) + selectedScore;
  selectedAnswers.push({
    question_id: currentQuestion.id,
    question: currentQuestion.question,
    category: currentQuestion.category,
    selected_answer_text: selectedAnswerText,
    selected_score: selectedScore
  });

  currentQuestionIndex++;
  if (currentQuestionIndex < assessmentQuestions.length) showQuestion();
  else await showResults();
}

function buildRecommendations() {
  const recs = [];
  Object.entries(categoryScores).forEach(([category, score]) => {
    const questionCount = selectedAnswers.filter(a => a.category === category).length;
    const max = questionCount * 3;
    const percent = max ? Math.round((score / max) * 100) : 0;
    if (percent < 40) recs.push(`Focus on ${category}: start with beginner tutorials and guided practice.`);
    else if (percent < 70) recs.push(`Develop ${category}: complete practical tasks and build confidence.`);
    else recs.push(`Strength in ${category}: consider advanced projects, mentoring, or certification.`);
  });
  return recs;
}

async function showResults() {
  hide(quiz);
  show(results);
  const maxScore = assessmentQuestions.length * 3;
  const percent = Math.round((totalScore / maxScore) * 100);
  const recs = buildRecommendations();

  resultTitle.textContent = "Assessment Complete";
  scoreText.textContent = `${currentProfile.display_name}, your score is ${totalScore} out of ${maxScore} (${percent}%).`;
  categoryBreakdown.innerHTML = Object.entries(categoryScores).map(([category, score]) => `<p><strong>${escapeHtml(category)}:</strong> ${score}</p>`).join("");
  recommendations.innerHTML = `<ul>${recs.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`;
  answerReview.innerHTML = selectedAnswers.map((a, index) => `
    <div class="review-item">
      <strong>${index + 1}. ${escapeHtml(a.question)}</strong><br>
      <span>Selected answer: ${escapeHtml(a.selected_answer_text)}</span><br>
      <span>Score: ${a.selected_score}</span>
    </div>`).join("");

  const { data: attempt, error } = await sb.from("assessment_attempts").insert({
    user_id: currentProfile.id,
    total_score: totalScore,
    max_score: maxScore,
    percentage: percent,
    category_scores: categoryScores,
    recommendations: recs
  }).select().single();
  if (error) return alert(error.message);

  const answerRows = selectedAnswers.map(a => ({ ...a, attempt_id: attempt.id }));
  const { error: answersError } = await sb.from("assessment_answers").insert(answerRows);
  if (answersError) alert(answersError.message);
}

async function logoutUser() {
  await sb.auth.signOut();
  location.reload();
}
