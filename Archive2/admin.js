const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const adminSummary = document.getElementById("adminSummary");
const resultsTable = document.getElementById("resultsTable");
const questionList = document.getElementById("questionList");
const questionForm = document.getElementById("questionForm");
const questionId = document.getElementById("questionId");
const categoryInput = document.getElementById("categoryInput");
const questionInput = document.getElementById("questionInput");
const answerInputs = document.getElementById("answerInputs");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const clearStatsBtn = document.getElementById("clearStatsBtn");
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
const groupStatsTable = document.getElementById("groupStatsTable");
const singleUserSelect = document.getElementById("singleUserSelect");
const viewSingleUserStatsBtn = document.getElementById("viewSingleUserStatsBtn");
const clearSingleUserStatsBtn = document.getElementById("clearSingleUserStatsBtn");
const singleUserStatsPanel = document.getElementById("singleUserStatsPanel");
const dashboardSections = document.querySelectorAll(".dashboard-section");
const menuOptions = document.querySelectorAll(".menu-option");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionFormCard = document.getElementById("questionFormCard");
const questionFormTitle = document.getElementById("questionFormTitle");

loginBtn.addEventListener("click", loginAdmin);
questionForm.addEventListener("submit", saveQuestionFromForm);
cancelEditBtn.addEventListener("click", resetQuestionForm);
clearStatsBtn.addEventListener("click", clearStats);
userForm.addEventListener("submit", saveUserFromForm);
cancelUserEditBtn.addEventListener("click", resetUserForm);
bulkUploadBtn.addEventListener("click", bulkUploadUsers);
viewSingleUserStatsBtn.addEventListener("click", () => renderSingleUserStats(Number(singleUserSelect.value)));
clearSingleUserStatsBtn.addEventListener("click", clearSingleUserStats);
singleUserSelect.addEventListener("change", () => renderSingleUserStats(Number(singleUserSelect.value)));
menuOptions.forEach((button) => {
  button.addEventListener("click", () => showDashboardSection(button.dataset.section));
});
addQuestionBtn.addEventListener("click", showAddQuestionForm);

document.addEventListener("DOMContentLoaded", () => {
  buildAnswerInputs();
  migrateEmailUsersToUsernameUsers();
  if (sessionStorage.getItem("adminLoggedIn") === "true") showAdminPanel();
});

function loginAdmin() {
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "true");
    showAdminPanel();
  } else {
    loginMessage.textContent = "Incorrect username or password.";
  }
}

function showAdminPanel() {
  loginSection.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  renderStats();
  renderUsers();
  renderUserSelect();
  renderResultsTable();
  renderQuestions();
  showDashboardSection("");
}

function showDashboardSection(sectionId) {
  dashboardSections.forEach((section) => section.classList.add("hidden"));
  menuOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });

  if (!sectionId) return;

  const section = document.getElementById(sectionId);
  if (section) section.classList.remove("hidden");

  if (sectionId === "questionsSection") {
    hideQuestionForm();
    renderQuestions();
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem("assessmentUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("assessmentUsers", JSON.stringify(users));
}

function migrateEmailUsersToUsernameUsers() {
  const users = getUsers();
  let changed = false;
  users.forEach((user) => {
    if (!user.username) {
      user.username = (user.email || user.name || `user${user.id}`).split("@")[0].replace(/[^a-z0-9._-]/gi, "").toLowerCase();
      user.password = user.password || "ChangeMe123";
      user.mustResetPassword = user.mustResetPassword ?? true;
      changed = true;
    }
    if (!user.groupCourse) {
      user.groupCourse = "Unassigned";
      changed = true;
    }
  });
  if (changed) saveUsers(users);
}

function normaliseUsername(username) {
  return username.trim().toLowerCase();
}

function saveUserFromForm(event) {
  event.preventDefault();
  const users = getUsers();
  const id = userId.value ? Number(userId.value) : Date.now();
  const username = normaliseUsername(managedUsername.value);

  const duplicate = users.find((user) => normaliseUsername(user.username || "") === username && user.id !== id);
  if (duplicate) {
    alert("A user with this username already exists.");
    return;
  }

  const existingIndex = users.findIndex((user) => user.id === id);
  const existingUser = existingIndex >= 0 ? users[existingIndex] : null;
  const typedPassword = managedUserPassword.value.trim();

  if (!existingUser && !typedPassword) {
    alert("Please enter a temporary password for the new user.");
    return;
  }

  const userData = {
    id,
    name: managedUserName.value.trim(),
    username,
    password: typedPassword || existingUser.password,
    groupCourse: managedUserGroupCourse.value.trim() || "Unassigned",
    status: managedUserStatus.value,
    mustResetPassword: managedMustReset.checked,
    createdAt: existingUser ? existingUser.createdAt : new Date().toISOString(),
    lastActive: existingUser ? existingUser.lastActive : ""
  };

  if (existingIndex >= 0) {
    users[existingIndex] = userData;
  } else {
    users.push(userData);
  }

  saveUsers(users);
  resetUserForm();
  renderUsers();
  renderUserSelect(id);
  renderStats();
  renderResultsTable();
}

function bulkUploadUsers() {
  const lines = bulkUsersInput.value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    bulkUploadMessage.textContent = "Paste at least one user first.";
    return;
  }

  const users = getUsers();
  const existingUsernames = new Set(users.map((user) => normaliseUsername(user.username || "")));
  let added = 0;
  const skipped = [];

  lines.forEach((line, index) => {
    const parts = line.split(",").map((part) => part.trim());
    if (parts.length < 4) {
      skipped.push(`Line ${index + 1}: missing name, username, password, or group/course`);
      return;
    }

    const [name, usernameRaw, password, groupCourseRaw] = parts;
    const username = normaliseUsername(usernameRaw);

    const groupCourse = groupCourseRaw || "Unassigned";

    if (!name || !username || !password || !groupCourse) {
      skipped.push(`Line ${index + 1}: missing name, username, password, or group/course`);
      return;
    }

    if (existingUsernames.has(username)) {
      skipped.push(`Line ${index + 1}: username already exists (${username})`);
      return;
    }

    users.push({
      id: Date.now() + index,
      name,
      username,
      password,
      groupCourse,
      status: "Active",
      mustResetPassword: true,
      createdAt: new Date().toISOString(),
      lastActive: ""
    });
    existingUsernames.add(username);
    added++;
  });

  saveUsers(users);
  bulkUsersInput.value = "";
  bulkUploadMessage.innerHTML = `${added} user(s) uploaded. ${skipped.length ? `<br><strong>Skipped:</strong><br>${skipped.map(escapeHtml).join("<br>")}` : ""}`;
  renderUsers();
  renderUserSelect();
  renderStats();
}

function renderUsers() {
  const users = getUsers();
  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];

  if (!users.length) {
    userTable.innerHTML = "<p>No users yet. Add users manually or bulk upload them above.</p>";
    return;
  }

  userTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Group/Course</th>
          <th>Status</th>
          <th>Password Reset</th>
          <th>Assessments</th>
          <th>Latest Score</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users.map((user) => {
          const userResults = savedResults.filter((result) => result.userId === user.id || result.username === user.username);
          const latest = userResults[userResults.length - 1];
          return `
            <tr>
              <td>${escapeHtml(user.name)}</td>
              <td>${escapeHtml(user.username)}</td>
              <td>${escapeHtml(user.groupCourse || "Unassigned")}</td>
              <td>${escapeHtml(user.status)}</td>
              <td>${user.mustResetPassword ? "Required" : "Completed"}</td>
              <td>${userResults.length}</td>
              <td>${latest ? `${latest.totalScore} / ${latest.maxScore} (${escapeHtml(latest.level)})` : "Not completed"}</td>
              <td>
                <button onclick="showUserDrillDown(${user.id})" class="secondary">View Stats</button>
                <button onclick="editUser(${user.id})">Edit</button>
                <button onclick="forcePasswordReset(${user.id})" class="secondary">Force Reset</button>
                <button class="danger" onclick="deleteUser(${user.id})">Delete</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}


function renderUserSelect(selectedId = singleUserSelect.value) {
  const users = getUsers().slice().sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username));
  singleUserSelect.innerHTML = `<option value="">Select a user</option>` + users.map((user) => `
    <option value="${user.id}" ${Number(selectedId) === user.id ? "selected" : ""}>
      ${escapeHtml(user.name || user.username)} (${escapeHtml(user.username)}) - ${escapeHtml(user.groupCourse || "Unassigned")}
    </option>
  `).join("");
}

function showUserDrillDown(id) {
  showDashboardSection("statsSection");
  renderUserSelect(id);
  renderSingleUserStats(id);
  document.getElementById("singleUserStatsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function getUserResults(user, savedResults) {
  return savedResults.filter((result) => result.userId === user.id || result.username === user.username);
}

function renderSingleUserStats(id) {
  if (!id) {
    singleUserStatsPanel.innerHTML = `<p>Select a user to see their individual stats.</p>`;
    return;
  }

  const users = getUsers();
  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  const user = users.find((item) => item.id === id);

  if (!user) {
    singleUserStatsPanel.innerHTML = `<p>User not found.</p>`;
    return;
  }

  const userResults = getUserResults(user, savedResults);
  const latest = userResults[userResults.length - 1];
  const averageScore = userResults.length ? (userResults.reduce((sum, result) => sum + result.totalScore, 0) / userResults.length).toFixed(1) : "0";
  const bestScore = userResults.length ? Math.max(...userResults.map((result) => result.totalScore)) : 0;
  const latestCategoryScores = latest?.categoryScores || {};

  singleUserStatsPanel.innerHTML = `
    <div class="single-user-card">
      <h4>${escapeHtml(user.name || user.username)}</h4>
      <p><strong>Username:</strong> ${escapeHtml(user.username)}</p>
      <p><strong>Group/Course:</strong> ${escapeHtml(user.groupCourse || "Unassigned")}</p>
      <p><strong>Status:</strong> ${escapeHtml(user.status || "Active")}</p>
      <p><strong>Password reset:</strong> ${user.mustResetPassword ? "Required" : "Completed"}</p>
      <p><strong>Assessments completed:</strong> ${userResults.length}</p>
      <p><strong>Average score:</strong> ${averageScore}</p>
      <p><strong>Best score:</strong> ${bestScore}</p>
      <p><strong>Latest result:</strong> ${latest ? `${latest.totalScore} / ${latest.maxScore || questions.length * 3} (${escapeHtml(latest.level)}) on ${new Date(latest.completedAt).toLocaleString()}` : "Not completed yet"}</p>
      <h4>Latest Category Scores</h4>
      ${Object.keys(latestCategoryScores).length ? `<table>
        <thead><tr><th>Category</th><th>Score</th></tr></thead>
        <tbody>${Object.entries(latestCategoryScores).map(([category, score]) => `<tr><td>${escapeHtml(category)}</td><td>${score}</td></tr>`).join("")}</tbody>
      </table>` : `<p>No category scores yet.</p>`}
      <h4>Assessment History</h4>
      ${userResults.length ? `<table>
        <thead><tr><th>Date</th><th>Score</th><th>Level</th><th>Recommendations</th></tr></thead>
        <tbody>${userResults.map((result) => `<tr>
          <td>${new Date(result.completedAt).toLocaleString()}</td>
          <td>${result.totalScore} / ${result.maxScore || questions.length * 3}</td>
          <td>${escapeHtml(result.level)}</td>
          <td>${escapeHtml(result.recommendations || "")}</td>
        </tr>`).join("")}</tbody>
      </table>` : `<p>No assessment history yet.</p>`}
    </div>
  `;
}

function clearSingleUserStats() {
  const id = Number(singleUserSelect.value);
  if (!id) {
    alert("Select a user first.");
    return;
  }

  const users = getUsers();
  const user = users.find((item) => item.id === id);
  if (!user) return;

  if (!confirm(`Clear all assessment stats for ${user.name || user.username}?`)) return;

  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  const remainingResults = savedResults.filter((result) => !(result.userId === user.id || result.username === user.username));
  localStorage.setItem("allAssessmentResults", JSON.stringify(remainingResults));
  renderStats();
  renderUsers();
  renderResultsTable();
  renderSingleUserStats(id);
}

function editUser(id) {
  const user = getUsers().find((item) => item.id === id);
  if (!user) return;
  userId.value = user.id;
  managedUserName.value = user.name;
  managedUsername.value = user.username;
  managedUserGroupCourse.value = user.groupCourse || "Unassigned";
  managedUserPassword.value = "";
  managedUserPassword.placeholder = "Leave blank to keep current password";
  managedUserStatus.value = user.status || "Active";
  managedMustReset.checked = Boolean(user.mustResetPassword);
  managedUserName.focus();
}

function forcePasswordReset(id) {
  const users = getUsers();
  const user = users.find((item) => item.id === id);
  if (!user) return;
  user.mustResetPassword = true;
  saveUsers(users);
  renderUsers();
  renderUserSelect(id);
  renderStats();
}

function deleteUser(id) {
  if (!confirm("Delete this user? Their assessment results will stay in the stats table.")) return;
  const users = getUsers().filter((user) => user.id !== id);
  saveUsers(users);
  renderUsers();
  renderUserSelect();
  renderStats();
}

function resetUserForm() {
  userForm.reset();
  userId.value = "";
  managedUserStatus.value = "Active";
  managedUserGroupCourse.value = "";
  managedMustReset.checked = true;
  managedUserPassword.placeholder = "Temporary password";
}

function showAddQuestionForm() {
  resetQuestionForm(false);
  questionFormTitle.textContent = "Add New Question";
  questionFormCard.classList.remove("hidden");
  categoryInput.focus();
}

function hideQuestionForm() {
  questionFormCard.classList.add("hidden");
}

function buildAnswerInputs() {
  answerInputs.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "answer-row";
    wrapper.innerHTML = `
      <label>Answer ${i + 1}</label>
      <input class="answerText" required placeholder="Answer text" />
      <input class="answerScore" type="number" min="0" max="3" required placeholder="Score" value="${i}" />
    `;
    answerInputs.appendChild(wrapper);
  }
}

function saveQuestionFromForm(event) {
  event.preventDefault();

  const answers = [...document.querySelectorAll(".answer-row")].map((row) => ({
    text: row.querySelector(".answerText").value.trim(),
    score: Number(row.querySelector(".answerScore").value)
  }));

  const questionData = {
    id: questionId.value ? Number(questionId.value) : Date.now(),
    category: categoryInput.value.trim(),
    question: questionInput.value.trim(),
    answers
  };

  if (questionId.value) {
    const index = questions.findIndex((q) => q.id === Number(questionId.value));
    questions[index] = questionData;
  } else {
    questions.push(questionData);
  }

  saveQuestions();
  resetQuestionForm();
  renderQuestions();
}

function renderQuestions() {
  questionList.innerHTML = "";

  if (!questions.length) {
    questionList.innerHTML = "<p>No questions yet.</p>";
    return;
  }

  questions.forEach((q) => {
    const div = document.createElement("div");
    div.className = "question-item";
    div.innerHTML = `
      <h3>${escapeHtml(q.question)}</h3>
      <p><strong>Category:</strong> ${escapeHtml(q.category)}</p>
      <ul>
        ${q.answers.map((a) => `<li>${escapeHtml(a.text)} <strong>Score:</strong> ${a.score}</li>`).join("")}
      </ul>
      <button onclick="editQuestion(${q.id})">Edit</button>
      <button class="danger" onclick="deleteQuestion(${q.id})">Delete</button>
    `;
    questionList.appendChild(div);
  });
}

function editQuestion(id) {
  const q = questions.find((question) => question.id === id);
  if (!q) return;

  questionFormTitle.textContent = "Edit Question";
  questionFormCard.classList.remove("hidden");

  questionId.value = q.id;
  categoryInput.value = q.category;
  questionInput.value = q.question;

  const rows = document.querySelectorAll(".answer-row");
  rows.forEach((row, index) => {
    row.querySelector(".answerText").value = q.answers[index]?.text || "";
    row.querySelector(".answerScore").value = q.answers[index]?.score ?? index;
  });

  document.getElementById("questionFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;
  questions = questions.filter((q) => q.id !== id);
  saveQuestions();
  renderQuestions();
}

function resetQuestionForm(hideForm = true) {
  questionForm.reset();
  questionId.value = "";
  questionFormTitle.textContent = "Add New Question";
  buildAnswerInputs();
  if (hideForm) hideQuestionForm();
}

function renderStats() {
  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  const users = getUsers();
  const total = savedResults.length;
  const averageScore = total ? (savedResults.reduce((sum, r) => sum + r.totalScore, 0) / total).toFixed(1) : 0;

  const levelCounts = savedResults.reduce((counts, result) => {
    counts[result.level] = (counts[result.level] || 0) + 1;
    return counts;
  }, {});

  const groupCounts = users.reduce((counts, user) => {
    const group = user.groupCourse || "Unassigned";
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, {});

  adminSummary.innerHTML = `
    <p><strong>Total users:</strong> ${users.length}</p>
    <p><strong>Active users:</strong> ${users.filter((user) => user.status === "Active").length}</p>
    <p><strong>Users needing password reset:</strong> ${users.filter((user) => user.mustResetPassword).length}</p>
    <p><strong>Total groups/courses:</strong> ${Object.keys(groupCounts).length}</p>
    <p><strong>Total assessments completed:</strong> ${total}</p>
    <p><strong>Overall average score:</strong> ${averageScore}</p>
    <p><strong>Beginner:</strong> ${levelCounts.Beginner || 0}</p>
    <p><strong>Developing:</strong> ${levelCounts.Developing || 0}</p>
    <p><strong>Proficient:</strong> ${levelCounts.Proficient || 0}</p>
    <p><strong>Advanced:</strong> ${levelCounts.Advanced || 0}</p>
  `;

  renderGroupStats(users, savedResults);
  renderUserSelect(singleUserSelect.value);
  renderSingleUserStats(Number(singleUserSelect.value));
}

function renderGroupStats(users, savedResults) {
  const groups = [...new Set(users.map((user) => user.groupCourse || "Unassigned"))].sort();

  if (!groups.length) {
    groupStatsTable.innerHTML = "<p>No groups/courses yet.</p>";
    return;
  }

  groupStatsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Group/Course</th>
          <th>Users</th>
          <th>Completed Assessments</th>
          <th>Average Score</th>
          <th>Beginner</th>
          <th>Developing</th>
          <th>Proficient</th>
          <th>Advanced</th>
        </tr>
      </thead>
      <tbody>
        ${groups.map((group) => {
          const groupUsers = users.filter((user) => (user.groupCourse || "Unassigned") === group);
          const groupResults = savedResults.filter((result) => (result.groupCourse || findUserGroup(result, users)) === group);
          const averageScore = groupResults.length ? (groupResults.reduce((sum, result) => sum + result.totalScore, 0) / groupResults.length).toFixed(1) : "0";
          const levels = groupResults.reduce((counts, result) => {
            counts[result.level] = (counts[result.level] || 0) + 1;
            return counts;
          }, {});
          return `
            <tr>
              <td>${escapeHtml(group)}</td>
              <td>${groupUsers.length}</td>
              <td>${groupResults.length}</td>
              <td>${averageScore}</td>
              <td>${levels.Beginner || 0}</td>
              <td>${levels.Developing || 0}</td>
              <td>${levels.Proficient || 0}</td>
              <td>${levels.Advanced || 0}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function findUserGroup(result, users) {
  const user = users.find((item) => item.id === result.userId || item.username === result.username);
  return user ? user.groupCourse || "Unassigned" : "Unassigned";
}

function findResultUserId(result, users) {
  const user = users.find((item) => item.id === result.userId || item.username === result.username);
  return user ? user.id : result.userId || "";
}

function renderResultsTable() {
  const savedResults = JSON.parse(localStorage.getItem("allAssessmentResults")) || [];
  const users = getUsers();

  if (!savedResults.length) {
    resultsTable.innerHTML = "<p>No saved user results yet.</p>";
    return;
  }

  resultsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Group/Course</th>
          <th>Score</th>
          <th>Level</th>
          <th>Category Scores</th>
          <th>Recommendations</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${savedResults.map((result) => `
          <tr>
            <td>${escapeHtml(result.userName)}</td>
            <td>${escapeHtml(result.username || result.userEmail || "")}</td>
            <td>${escapeHtml(result.groupCourse || findUserGroup(result, users))}</td>
            <td>${result.totalScore} / ${result.maxScore || questions.length * 3}</td>
            <td>${escapeHtml(result.level)}</td>
            <td>${formatCategoryScores(result.categoryScores)}</td>
            <td>${escapeHtml(result.recommendations || "")}</td>
            <td>${new Date(result.completedAt).toLocaleString()}</td>
            <td><button onclick="showUserDrillDown(${findResultUserId(result, users)})" class="secondary">View User</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formatCategoryScores(categoryScores = {}) {
  return Object.entries(categoryScores)
    .map(([category, score]) => `${escapeHtml(category)}: ${score}`)
    .join("<br>");
}

function clearStats() {
  if (!confirm("Clear all user stats?")) return;
  localStorage.removeItem("allAssessmentResults");
  localStorage.removeItem("latestAssessmentResult");
  renderStats();
  renderResultsTable();
  renderUsers();
  renderSingleUserStats(Number(singleUserSelect.value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
