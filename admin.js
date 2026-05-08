let adminProfile = null;
let cachedUsers = [];
let cachedAttempts = [];
let cachedQuestions = [];

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const dashboardSections = document.querySelectorAll(".dashboard-section");
const menuOptions = document.querySelectorAll(".menu-option");
const adminSummary = document.getElementById("adminSummary");
const groupStatsTable = document.getElementById("groupStatsTable");
const singleUserSelect = document.getElementById("singleUserSelect");
const singleUserStatsPanel = document.getElementById("singleUserStatsPanel");
const viewSingleUserStatsBtn = document.getElementById("viewSingleUserStatsBtn");
const userForm = document.getElementById("userForm");
const userId = document.getElementById("userId");
const managedUserName = document.getElementById("managedUserName");
const managedUsername = document.getElementById("managedUsername");
const managedUserGroupCourse = document.getElementById("managedUserGroupCourse");
const managedUserPassword = document.getElementById("managedUserPassword");
const managedUserStatus = document.getElementById("managedUserStatus");
const managedMustReset = document.getElementById("managedMustReset");
const cancelUserEditBtn = document.getElementById("cancelUserEditBtn");
const bulkUsersInput = document.getElementById("bulkUsersInput");
const bulkUploadBtn = document.getElementById("bulkUploadBtn");
const bulkUploadMessage = document.getElementById("bulkUploadMessage");
const userTable = document.getElementById("userTable");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionFormCard = document.getElementById("questionFormCard");
const questionFormTitle = document.getElementById("questionFormTitle");
const questionForm = document.getElementById("questionForm");
const questionId = document.getElementById("questionId");
const categoryInput = document.getElementById("categoryInput");
const questionInput = document.getElementById("questionInput");
const answerInputs = document.getElementById("answerInputs");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const questionList = document.getElementById("questionList");
const resultsTable = document.getElementById("resultsTable");

loginBtn.addEventListener("click", loginAdmin);
adminLogoutBtn.addEventListener("click", logoutAdmin);
menuOptions.forEach(btn => btn.addEventListener("click", () => showDashboardSection(btn.dataset.section)));
viewSingleUserStatsBtn.addEventListener("click", () => renderSingleUserStats(singleUserSelect.value));
singleUserSelect.addEventListener("change", () => renderSingleUserStats(singleUserSelect.value));
userForm.addEventListener("submit", saveUserFromForm);
cancelUserEditBtn.addEventListener("click", resetUserForm);
bulkUploadBtn.addEventListener("click", bulkUploadUsers);
addQuestionBtn.addEventListener("click", showAddQuestionForm);
questionForm.addEventListener("submit", saveQuestionFromForm);
cancelEditBtn.addEventListener("click", resetQuestionForm);

document.addEventListener("DOMContentLoaded", async () => {
  buildAnswerInputs();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    try {
      adminProfile = await getProfile();
      if (adminProfile.role === "admin") await showAdminPanel();
    } catch (_) {}
  }
});

async function loginAdmin() {
  loginMessage.textContent = "";
  const loginIdentifier = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (!loginIdentifier || !password) return loginMessage.textContent = "Enter your email/username and password.";

  const { error } = await sb.auth.signInWithPassword({ email: loginIdentifierToEmail(loginIdentifier), password });
  if (error) return loginMessage.textContent = `Login failed: ${error.message}`;

  try {
    adminProfile = await getProfile();
  } catch (profileError) {
    await sb.auth.signOut();
    return loginMessage.textContent = "Login worked, but no matching profile row was found. Add this user to the profiles table and set role to admin.";
  }
  if (adminProfile.role !== "admin") {
    await sb.auth.signOut();
    return loginMessage.textContent = "This account is not an admin account.";
  }
  await showAdminPanel();
}

async function showAdminPanel() {
  hide(loginSection);
  show(adminPanel);
  await refreshAll();
  showDashboardSection("statsSection");
}

async function refreshAll() {
  await Promise.all([loadUsers(), loadAttempts(), renderQuestions()]);
  renderStats();
  renderUsers();
  renderUserSelect();
  renderResults();
}

function showDashboardSection(sectionId) {
  dashboardSections.forEach(section => hide(section));
  const section = document.getElementById(sectionId);
  if (section) show(section);
  if (sectionId === "questionsSection") resetQuestionForm();
}

async function loadUsers() {
  const { data, error } = await sb.from("profiles").select("*").order("display_name");
  if (error) throw error;
  cachedUsers = data || [];
}

async function loadAttempts() {
  const { data, error } = await sb
    .from("assessment_attempts")
    .select("*, profiles(display_name, username, group_course)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  cachedAttempts = data || [];
}

function renderStats() {
  const userCount = cachedUsers.filter(u => u.role === "user").length;
  const attemptCount = cachedAttempts.length;
  const avg = attemptCount ? Math.round(cachedAttempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attemptCount) : 0;
  adminSummary.innerHTML = `<div class="stats-grid"><div><strong>${userCount}</strong><br>Users</div><div><strong>${attemptCount}</strong><br>Attempts</div><div><strong>${avg}%</strong><br>Average Score</div></div>`;

  const groups = {};
  cachedAttempts.forEach(a => {
    const group = a.profiles?.group_course || "No group/course";
    if (!groups[group]) groups[group] = { attempts: 0, total: 0 };
    groups[group].attempts++;
    groups[group].total += Number(a.percentage || 0);
  });
  groupStatsTable.innerHTML = table(["Group/Course", "Attempts", "Average"], Object.entries(groups).map(([g, v]) => [g, v.attempts, `${Math.round(v.total / v.attempts)}%`]));
}

function renderUserSelect() {
  singleUserSelect.innerHTML = `<option value="">Select a user</option>` + cachedUsers
    .filter(u => u.role === "user")
    .map(u => `<option value="${u.id}">${escapeHtml(u.display_name)} (${escapeHtml(u.username)})</option>`).join("");
}

function renderSingleUserStats(userIdValue) {
  if (!userIdValue) return singleUserStatsPanel.innerHTML = "";
  const user = cachedUsers.find(u => u.id === userIdValue);
  const attempts = cachedAttempts.filter(a => a.user_id === userIdValue);
  if (!user) return;
  const latest = attempts[0];
  singleUserStatsPanel.innerHTML = `
    <h4>${escapeHtml(user.display_name)} (${escapeHtml(user.username)})</h4>
    <p><strong>Group/Course:</strong> ${escapeHtml(user.group_course)}</p>
    <p><strong>Total attempts:</strong> ${attempts.length}</p>
    ${latest ? `<p><strong>Latest score:</strong> ${latest.total_score}/${latest.max_score} (${latest.percentage}%)</p>` : `<p>No attempts yet.</p>`}
    ${latest?.category_scores ? `<h4>Latest category scores</h4>${table(["Category", "Score"], Object.entries(latest.category_scores))}` : ""}
    ${latest?.recommendations ? `<h4>Latest recommendations</h4><ul>${latest.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}
  `;
}

function renderUsers() {
  const rows = cachedUsers.map(u => [
    escapeHtml(u.display_name), escapeHtml(u.username), escapeHtml(u.group_course), escapeHtml(u.role), escapeHtml(u.status), u.must_reset_password ? "Yes" : "No",
    `<button onclick="editUser('${u.id}')">Edit</button> <button class="danger" onclick="deleteUser('${u.id}')">Delete</button>`
  ]);
  userTable.innerHTML = table(["Name", "Username", "Group/Course", "Role", "Status", "Must Reset", "Actions"], rows, true);
}

async function saveUserFromForm(event) {
  event.preventDefault();
  const id = userId.value;
  const payload = {
    display_name: managedUserName.value.trim(),
    username: managedUsername.value.trim().toLowerCase(),
    group_course: managedUserGroupCourse.value.trim(),
    status: managedUserStatus.value,
    must_reset_password: managedMustReset.checked,
    password: managedUserPassword.value
  };

  if (!payload.display_name || !payload.username || !payload.group_course) return alert("Name, username and group/course are required.");
  if (!id && !payload.password) return alert("Temporary password is required for new users.");

  if (id) {
    const { error } = await sb.from("profiles").update({
      display_name: payload.display_name,
      username: payload.username,
      group_course: payload.group_course,
      status: payload.status,
      must_reset_password: payload.must_reset_password
    }).eq("id", id);
    if (error) return alert(error.message);
    if (payload.password) await callAdminUsers({ action: "set-password", id, password: payload.password, must_reset_password: true });
  } else {
    await callAdminUsers({ action: "create-user", ...payload });
  }
  resetUserForm();
  await refreshAll();
}

function editUser(id) {
  const u = cachedUsers.find(x => x.id === id);
  if (!u) return;
  userId.value = u.id;
  managedUserName.value = u.display_name || "";
  managedUsername.value = u.username || "";
  managedUserGroupCourse.value = u.group_course || "";
  managedUserPassword.value = "";
  managedUserStatus.value = u.status || "active";
  managedMustReset.checked = !!u.must_reset_password;
}

function resetUserForm() {
  userForm.reset();
  userId.value = "";
  managedUserStatus.value = "active";
  managedMustReset.checked = true;
}

async function deleteUser(id) {
  if (!confirm("Delete this user and their auth account?")) return;
  await callAdminUsers({ action: "delete-user", id });
  await refreshAll();
}

async function bulkUploadUsers() {
  bulkUploadMessage.textContent = "";
  const users = bulkUsersInput.value.split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
    const [display_name, username, group_course, password] = line.split(",").map(v => v?.trim());
    return { display_name, username: username?.toLowerCase(), group_course, password, must_reset_password: true, status: "active" };
  });
  if (!users.length) return bulkUploadMessage.textContent = "Paste at least one user.";
  await callAdminUsers({ action: "bulk-create-users", users });
  bulkUploadMessage.textContent = `${users.length} users uploaded.`;
  bulkUsersInput.value = "";
  await refreshAll();
}

async function callAdminUsers(body) {
  const { data, error } = await sb.functions.invoke("admin-users", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

function buildAnswerInputs() {
  answerInputs.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    answerInputs.innerHTML += `<div class="answer-admin-row"><label>Answer ${i + 1} text</label><input class="answerTextInput" required /><label>Score</label><select class="answerScoreInput"><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>`;
  }
}

function showAddQuestionForm() {
  resetQuestionForm();
  questionFormTitle.textContent = "Add Question";
  show(questionFormCard);
}

async function renderQuestions() {
  const { data, error } = await sb.from("questions").select("*, answers(*)").order("display_order").order("display_order", { foreignTable: "answers" });
  if (error) throw error;
  cachedQuestions = data || [];
  questionList.innerHTML = cachedQuestions.map(q => `
    <div class="question-admin-card">
      <h4>${escapeHtml(q.category)}</h4>
      <p>${escapeHtml(q.question)}</p>
      <ol>${(q.answers || []).map(a => `<li>${escapeHtml(a.answer_text)} <strong>(${a.score})</strong></li>`).join("")}</ol>
      <button onclick="editQuestionById('${q.id}')">Edit</button>
      <button class="danger" onclick="deleteQuestion('${q.id}')">Delete</button>
    </div>`).join("");
}

async function saveQuestionFromForm(event) {
  event.preventDefault();
  const id = questionId.value;
  const qPayload = { category: categoryInput.value.trim(), question: questionInput.value.trim(), is_active: true };
  let savedQuestion;
  if (id) {
    const { data, error } = await sb.from("questions").update(qPayload).eq("id", id).select().single();
    if (error) return alert(error.message);
    savedQuestion = data;
    await sb.from("answers").delete().eq("question_id", id);
  } else {
    const { data, error } = await sb.from("questions").insert(qPayload).select().single();
    if (error) return alert(error.message);
    savedQuestion = data;
  }
  const texts = [...document.querySelectorAll(".answerTextInput")];
  const scores = [...document.querySelectorAll(".answerScoreInput")];
  const answers = texts.map((input, index) => ({ question_id: savedQuestion.id, answer_text: input.value.trim(), score: Number(scores[index].value), display_order: index + 1 }));
  const { error } = await sb.from("answers").insert(answers);
  if (error) return alert(error.message);
  resetQuestionForm();
  await renderQuestions();
}

function editQuestionById(id) {
  const q = cachedQuestions.find(item => item.id === id);
  if (!q) return;
  questionId.value = q.id;
  categoryInput.value = q.category;
  questionInput.value = q.question;
  const texts = [...document.querySelectorAll(".answerTextInput")];
  const scores = [...document.querySelectorAll(".answerScoreInput")];
  (q.answers || []).forEach((a, i) => {
    if (texts[i]) texts[i].value = a.answer_text;
    if (scores[i]) scores[i].value = a.score;
  });
  questionFormTitle.textContent = "Edit Question";
  show(questionFormCard);
}

async function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;
  const { error } = await sb.from("questions").delete().eq("id", id);
  if (error) return alert(error.message);
  await renderQuestions();
}

function resetQuestionForm() {
  questionForm.reset();
  questionId.value = "";
  questionFormTitle.textContent = "Add Question";
  hide(questionFormCard);
}

function renderResults() {
  const rows = cachedAttempts.map(a => [
    new Date(a.created_at).toLocaleString(), escapeHtml(a.profiles?.display_name), escapeHtml(a.profiles?.username), escapeHtml(a.profiles?.group_course), `${a.total_score}/${a.max_score}`, `${a.percentage}%`,
    `<button onclick="renderSingleUserStats('${a.user_id}'); showDashboardSection('statsSection'); singleUserSelect.value='${a.user_id}'">View User</button>`
  ]);
  resultsTable.innerHTML = table(["Date", "Name", "Username", "Group/Course", "Score", "%", "Actions"], rows, true);
}

function table(headers, rows, html = false) {
  if (!rows.length) return "<p>No records yet.</p>";
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${html ? cell : escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

async function logoutAdmin() {
  await sb.auth.signOut();
  location.reload();
}

document.getElementById("backLink").addEventListener("click", async (e) => {

    e.preventDefault();

    // LOG OUT ADMIN
    await sb.auth.signOut();

    // RETURN TO ASSESSMENT
    window.location.href = "index.html";
});
