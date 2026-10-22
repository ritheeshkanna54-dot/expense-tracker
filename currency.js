
const usdStatus = document.getElementById("usdStatus");
const usdRate = document.getElementById("usdRate");
const refreshRateBtn = document.getElementById("refreshRateBtn");

let exchangeRate = null;

function formatUSD(inrAmount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(inrAmount * exchangeRate);
}

async function loadExchangeRate() {
  refreshRateBtn.disabled = true;
  usdStatus.textContent = "USD view: Loading exchange rate...";
  usdRate.textContent = "";

  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/INR"
    );

    if (!response.ok) {
      throw new Error("Exchange rate request failed");
    }

    const data = await response.json();
    const rate = Number(data.rates?.USD);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid exchange rate");
    }

    exchangeRate = rate;
    updateUSDDisplay();

    usdRate.textContent =
      `1 INR ≈ ${rate.toFixed(6)} USD`;

  } catch (error) {
    usdStatus.textContent =
      "USD view: Exchange rate unavailable.";

    usdRate.textContent =
      "Check your internet connection and refresh.";
  } finally {
    refreshRateBtn.disabled = false;
  }
}

function updateUSDDisplay() {
  if (exchangeRate === null || !window.SpendSmart) {
    return;
  }

  const spent = window.SpendSmart.getMonthlySpent();

  usdStatus.textContent =
    `USD view: ${formatUSD(spent)} spent this month`;
}

refreshRateBtn.addEventListener("click", loadExchangeRate);

const originalRender = window.SpendSmart.getMonthlySpent;

window.addEventListener("focus", updateUSDDisplay);

loadExchangeRate();
