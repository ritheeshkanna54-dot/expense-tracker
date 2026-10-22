const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "spendsmart_expenses";
const BUDGET_KEY = "spendsmart_budget";

let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let budget = Number(localStorage.getItem(BUDGET_KEY)) || null;

const expenseForm = $("expenseForm");
const budgetForm = $("budgetForm");

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(amount);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));

  if (budget === null) {
    localStorage.removeItem(BUDGET_KEY);
  } else {
    localStorage.setItem(BUDGET_KEY, String(budget));
  }
}

function getMonthlyExpenses() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  return expenses.filter(item => item.date.startsWith(month));
}

function renderSummary() {
  const monthly = getMonthlyExpenses();

  const spent = monthly.reduce(
    (total, item) => total + Number(item.amount), 0
  );

  $("spentThisMonth").textContent = money(spent);
  $("expenseCount").textContent = monthly.length;

  $("remainingBudget").textContent =
    budget === null ? "—" : money(budget - spent);

  $("budgetAmount").value = budget ?? "";
}

function formatDate(date) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

function getFilteredExpenses() {
  const search = $("searchInput").value.toLowerCase().trim();
  const category = $("categoryFilter").value;
  const sort = $("sortSelect").value;

  const result = expenses.filter(item =>
    item.name.toLowerCase().includes(search) &&
    (!category || item.category === category)
  );

  result.sort((a, b) => {
    switch (sort) {
      case "date-asc":
        return a.date.localeCompare(b.date);

      case "amount-desc":
        return b.amount - a.amount;

      case "amount-asc":
        return a.amount - b.amount;

      case "name-asc":
        return a.name.localeCompare(b.name);

      default:
        return b.date.localeCompare(a.date);
    }
  });

  return result;
}

function renderExpenses() {
  const tbody = $("expenseTableBody");
  const shown = getFilteredExpenses();

  tbody.replaceChildren();

  shown.forEach(item => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);

    const nameCell = document.createElement("td");
    nameCell.textContent = item.name;

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "category-pill";
    badge.textContent = item.category;
    categoryCell.appendChild(badge);

    const amountCell = document.createElement("td");
    amountCell.className = "amount-cell";
    amountCell.textContent = money(Number(item.amount));

    const actionCell = document.createElement("td");
    actionCell.className = "actions-cell";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";

    deleteButton.addEventListener("click", () => {
      deleteExpense(item.id);
    });

    actionCell.appendChild(deleteButton);

    row.append(
      dateCell,
      nameCell,
      categoryCell,
      amountCell,
      actionCell
    );

    tbody.appendChild(row);
  });

  $("emptyState").hidden = shown.length > 0;
  $("resultCount").textContent = `${shown.length} shown`;

  const total = shown.reduce(
    (sum, item) => sum + Number(item.amount), 0
  );

  $("tableTotal").textContent = `Total: ${money(total)}`;
}

function render() {
  renderSummary();
  renderExpenses();
}

function deleteExpense(id) {
  const item = expenses.find(expense => expense.id === id);

  if (!item || !confirm(`Delete "${item.name}"?`)) {
    return;
  }

  expenses = expenses.filter(expense => expense.id !== id);

  saveData();
  render();
}

expenseForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("expenseName").value.trim();
  const amount = Number($("expenseAmount").value);
  const category = $("expenseCategory").value;
  const date = $("expenseDate").value;

  if (!name || !Number.isFinite(amount) ||
      amount <= 0 || !category || !date) {
    $("expenseMessage").textContent =
      "Please enter valid expense details.";
    return;
  }

  expenses.push({
    id: `${Date.now()}-${Math.random()}`,
    name,
    amount: Math.round(amount * 100) / 100,
    category,
    date
  });

  saveData();
  expenseForm.reset();
  $("expenseDate").value = todayLocal();
  $("expenseMessage").textContent = "Expense added successfully.";

  render();

  setTimeout(() => {
    $("expenseMessage").textContent = "";
  }, 2500);
});

budgetForm.addEventListener("submit", event => {
  event.preventDefault();

  const value = Number($("budgetAmount").value);

  if (!Number.isFinite(value) || value <= 0) {
    $("budgetMessage").textContent =
      "Enter a budget greater than ₹0.";
    return;
  }

  budget = Math.round(value * 100) / 100;
  saveData();
  renderSummary();

  $("budgetMessage").textContent = "Monthly budget saved.";

  setTimeout(() => {
    $("budgetMessage").textContent = "";
  }, 2500);
});

$("searchInput").addEventListener("input", renderExpenses);
$("categoryFilter").addEventListener("change", renderExpenses);
$("sortSelect").addEventListener("change", renderExpenses);

$("clearAllBtn").addEventListener("click", () => {
  if (!confirm("Clear all expenses and the monthly budget?")) {
    return;
  }

  expenses = [];
  budget = null;

  saveData();
  render();

  $("budgetMessage").textContent = "";
  $("expenseMessage").textContent = "";
});

$("exportBtn").addEventListener("click", () => {
  const rows = [
    ["Date", "Name", "Category", "Amount (INR)"],
    getFilteredExpenses().map(item => [
      item.date,
      item.name,
      item.category,
      Number(item.amount).toFixed(2)
    ])
  ];

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value).replace(/"/g, '""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "spendsmart-expenses.csv";
  link.click();

  URL.revokeObjectURL(url);
});

window.SpendSmart = {
  getMonthlySpent() {
    return getMonthlyExpenses().reduce(
      (sum, item) => sum + Number(item.amount), 0
    );
  }
};

$("expenseDate").value = todayLocal();
render();
