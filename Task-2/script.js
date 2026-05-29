const PHONE_CATALOG = [
  { brand: 'Apple', model: 'iPhone 15', price: 799, benchmark: 900, batteryHours: 20, cameraScore: 88 },
  { brand: 'Apple', model: 'iPhone 15 Pro', price: 999, benchmark: 960, batteryHours: 23, cameraScore: 94 },
  { brand: 'Samsung', model: 'Galaxy S24', price: 799, benchmark: 910, batteryHours: 24, cameraScore: 90 },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', price: 1199, benchmark: 980, batteryHours: 28, cameraScore: 97 },
  { brand: 'Google', model: 'Pixel 8', price: 699, benchmark: 840, batteryHours: 20, cameraScore: 92 },
  { brand: 'Google', model: 'Pixel 8 Pro', price: 999, benchmark: 900, batteryHours: 25, cameraScore: 95 },
  { brand: 'OnePlus', model: 'OnePlus 12', price: 799, benchmark: 950, batteryHours: 27, cameraScore: 89 },
  { brand: 'Xiaomi', model: 'Xiaomi 14', price: 699, benchmark: 930, batteryHours: 24, cameraScore: 87 }
];

const form = document.getElementById('preferencesForm');
const budgetInput = document.getElementById('budget');
const minBatteryInput = document.getElementById('minBattery');
const brandPreferenceInput = document.getElementById('brandPreference');
const topNInput = document.getElementById('topN');
const weightPerformance = document.getElementById('weightPerformance');
const weightBattery = document.getElementById('weightBattery');
const weightCamera = document.getElementById('weightCamera');
const weightValue = document.getElementById('weightValue');
const weightStatus = document.getElementById('weightStatus');
const resultsContainer = document.getElementById('results');
const summary = document.getElementById('resultSummary');
const resetBtn = document.getElementById('resetBtn');

const normalize = (value, min, max) => {
  if (max === min) return 1;
  return (value - min) / (max - min);
};

const getWeights = () => {
  const weights = {
    performance: Number(weightPerformance.value),
    battery: Number(weightBattery.value),
    camera: Number(weightCamera.value),
    value: Number(weightValue.value)
  };

  const total = Object.values(weights).reduce((sum, current) => sum + current, 0);
  return { weights, total };
};

const validateWeights = () => {
  const { total } = getWeights();
  if (total !== 100) {
    weightStatus.textContent = `Weights must add up to 100. Current total: ${total}.`;
    weightStatus.classList.remove('valid');
    return false;
  }

  weightStatus.textContent = 'Weights look good.';
  weightStatus.classList.add('valid');
  return true;
};

const scorePhones = ({ budget, minBattery, brandPreference }) => {
  const eligible = PHONE_CATALOG.filter((phone) => {
    const inBudget = phone.price <= budget;
    const batteryOk = phone.batteryHours >= minBattery;
    const brandOk = brandPreference === 'Any' || phone.brand === brandPreference;
    return inBudget && batteryOk && brandOk;
  });

  if (eligible.length === 0) {
    return [];
  }

  const { weights } = getWeights();
  const scaledWeights = {
    performance: weights.performance / 100,
    battery: weights.battery / 100,
    camera: weights.camera / 100,
    value: weights.value / 100
  };

  const benchmarks = eligible.map((p) => p.benchmark);
  const batteries = eligible.map((p) => p.batteryHours);
  const cameras = eligible.map((p) => p.cameraScore);
  const values = eligible.map((p) => p.benchmark / p.price);

  const range = {
    benchmark: { min: Math.min(...benchmarks), max: Math.max(...benchmarks) },
    battery: { min: Math.min(...batteries), max: Math.max(...batteries) },
    camera: { min: Math.min(...cameras), max: Math.max(...cameras) },
    value: { min: Math.min(...values), max: Math.max(...values) }
  };

  return eligible
    .map((phone) => {
      const valueRatio = phone.benchmark / phone.price;
      const normPerformance = normalize(phone.benchmark, range.benchmark.min, range.benchmark.max);
      const normBattery = normalize(phone.batteryHours, range.battery.min, range.battery.max);
      const normCamera = normalize(phone.cameraScore, range.camera.min, range.camera.max);
      const normValue = normalize(valueRatio, range.value.min, range.value.max);

      const weightedScore =
        normPerformance * scaledWeights.performance +
        normBattery * scaledWeights.battery +
        normCamera * scaledWeights.camera +
        normValue * scaledWeights.value;

      return {
        ...phone,
        valueRatio,
        weightedScore
      };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);
};

const renderResults = (recommendations, requestedCount) => {
  resultsContainer.innerHTML = '';

  if (recommendations.length === 0) {
    summary.textContent =
      'No phones matched your budget + battery + brand preferences. Try increasing budget or reducing constraints.';
    resultsContainer.innerHTML = '<div class="no-results">No matching phones found for the selected constraints.</div>';
    return;
  }

  const selected = recommendations.slice(0, requestedCount);
  summary.textContent = `Showing top ${selected.length} phone recommendation(s) sorted by your weighted score.`;

  selected.forEach((phone, index) => {
    const card = document.createElement('article');
    card.className = 'phone-card';

    card.innerHTML = `
      <h3>#${index + 1}: ${phone.brand} ${phone.model}</h3>
      <div class="meta">
        <span><strong>Price:</strong> $${phone.price}</span>
        <span><strong>Benchmark:</strong> ${phone.benchmark}</span>
        <span><strong>Battery:</strong> ${phone.batteryHours} hrs</span>
        <span><strong>Camera:</strong> ${phone.cameraScore}/100</span>
        <span><strong>Value ratio:</strong> ${(phone.valueRatio).toFixed(3)}</span>
      </div>
      <div class="score">Weighted Score: ${(phone.weightedScore * 100).toFixed(2)}</div>
    `;

    resultsContainer.appendChild(card);
  });
};

const getFormPreferences = () => ({
  budget: Number(budgetInput.value),
  minBattery: Number(minBatteryInput.value),
  brandPreference: brandPreferenceInput.value,
  topN: Number(topNInput.value)
});

[weightPerformance, weightBattery, weightCamera, weightValue].forEach((input) => {
  input.addEventListener('input', validateWeights);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateWeights()) {
    summary.textContent = 'Please fix your weight distribution before generating recommendations.';
    resultsContainer.innerHTML = '';
    return;
  }

  const preferences = getFormPreferences();
  const recommendations = scorePhones(preferences);
  renderResults(recommendations, preferences.topN);
});

resetBtn.addEventListener('click', () => {
  form.reset();
  validateWeights();
  summary.textContent = 'Fill in your preferences and click “Get Recommendations”.';
  resultsContainer.innerHTML = '';
});

validateWeights();
