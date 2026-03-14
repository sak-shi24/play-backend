const API = "https://play-backend-xa7x.onrender.com/api/admin";

// ============================
// Check admin login
// ============================
const admin = JSON.parse(localStorage.getItem("admin"));
if (!admin) {
  window.location.href = "../adminLogin.html";
}

// ============================
// Logout
// ============================
function logout() {
  localStorage.removeItem("admin");
  window.location.href = "../adminLogin.html";
}

// ============================
// DASHBOARD STATS
// ============================
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();
    const statsDiv = document.getElementById("stats");
    if (statsDiv) {
      statsDiv.innerHTML = `
        <p>Total Users: ${data.totalUsers}</p>
        <p>Total Deposits: ₹ ${data.totalDeposits}</p>
        <p>Total Withdrawals: ₹ ${data.totalWithdrawals}</p>
        <p>Active Challenges: ${data.activeChallenges}</p>
      `;
    }
    // Update dashboard cards if they exist
    if (document.getElementById("usersCount")) document.getElementById("usersCount").innerText = data.totalUsers;
    if (document.getElementById("depositsCount")) document.getElementById("depositsCount").innerText = data.totalDeposits;
    if (document.getElementById("withdrawalsCount")) document.getElementById("withdrawalsCount").innerText = data.totalWithdrawals;
    if (document.getElementById("challengesCount")) document.getElementById("challengesCount").innerText = data.activeChallenges;

  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

// ============================
// USERS TABLE
// ============================
async function loadUsers() {
  try {
    const res = await fetch(`${API}/users`);
    const data = await res.json();

    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.users && data.users.length > 0) {
      data.users.forEach(u => {
        tbody.innerHTML += `<tr>
          <td>${u.name}</td>
          <td>${u.phone}</td>
          <td>₹ ${u.wallet}</td>
          <td>${new Date(u.created_at).toLocaleString()}</td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No users found</td></tr>`;
    }

  } catch (err) {
    console.error("Error loading users:", err);
    const tbody = document.querySelector("#usersTable tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Server error</td></tr>`;
  }
}

// ============================
// DEPOSITS TABLE
// ============================
async function loadDeposits() {
  try {
    const res = await fetch(`${API}/deposits`);
    const data = await res.json();
    const tbody = document.querySelector("#depositsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.deposits && data.deposits.length > 0) {
      data.deposits.forEach(d => {
        tbody.innerHTML += `<tr>
          <td>${d.user_name}</td>
          <td>₹ ${d.amount}</td>
          <td>${d.status}</td>
          <td>${new Date(d.created_at).toLocaleString()}</td>
          <td><button onclick="approveDeposit(${d.id})">Approve</button></td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No deposits found</td></tr>`;
    }

  } catch (err) {
    console.error(err);
  }
}

async function approveDeposit(id) {
  await fetch(`${API}/deposit/approve/${id}`, { method: "POST" });
  loadDeposits();
}

// ============================
// WITHDRAWALS TABLE
// ============================
async function loadWithdrawals() {
  try {
    const res = await fetch(`${API}/withdrawals`);
    const data = await res.json();
    const tbody = document.querySelector("#withdrawalsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.withdrawals && data.withdrawals.length > 0) {
      data.withdrawals.forEach(w => {
        tbody.innerHTML += `<tr>
          <td>${w.user_name}</td>
          <td>₹ ${w.amount}</td>
          <td>${w.status}</td>
          <td>${new Date(w.created_at).toLocaleString()}</td>
          <td><button onclick="approveWithdrawal(${w.id})">Approve</button></td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No withdrawals found</td></tr>`;
    }

  } catch (err) {
    console.error(err);
  }
}

async function approveWithdrawal(id) {
  await fetch(`${API}/withdraw/approve/${id}`, { method: "POST" });
  loadWithdrawals();
}

// ============================
// CHALLENGES TABLE
// ============================
async function loadChallenges() {
  try {
    const res = await fetch(`${API}/challenges`);
    const data = await res.json();
    const tbody = document.querySelector("#challengesTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.challenges && data.challenges.length > 0) {
      data.challenges.forEach(c => {
        tbody.innerHTML += `<tr>
          <td>${c.id}</td>
          <td>${c.title}</td>
          <td>₹ ${c.reward}</td>
          <td>${c.status}</td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No challenges found</td></tr>`;
    }

  } catch (err) {
    console.error(err);
  }
}

// ============================
// Initialize based on page
// ============================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("stats")) loadDashboardStats();
  if (document.getElementById("usersTable")) loadUsers();
  if (document.getElementById("depositsTable")) loadDeposits();
  if (document.getElementById("withdrawalsTable")) loadWithdrawals();
  if (document.getElementById("challengesTable")) loadChallenges();
});
