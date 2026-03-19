let questions = [];
let quiz = [];
let time = 2700; // 45 phút
let timer;

document.getElementById("upload").addEventListener("change", handleFile);

function handleFile(event) {
  const reader = new FileReader();

  reader.onload = function(event) {
    mammoth.extractRawText({arrayBuffer: event.target.result})
      .then(result => {
        parseQuestions(result.value);
        alert("Đã đọc file thành công!");
      });
  };

  reader.readAsArrayBuffer(event.target.files[0]);
}

function parseQuestions(text) {
  let blocks = text.split(/Câu\s+\d+:/g);
  blocks.shift();

  questions = blocks.map(block => {
    let lines = block.trim().split("\n").filter(x => x);

    let q = lines[0];

    let options = {};
    lines.forEach(line => {
      if (line.startsWith("A.")) options.A = line.slice(2);
      if (line.startsWith("B.")) options.B = line.slice(2);
      if (line.startsWith("C.")) options.C = line.slice(2);
      if (line.startsWith("D.")) options.D = line.slice(2);
    });

    // ⚠️ bạn cần sửa nếu đáp án có dạng khác
    let correct = "A"; // tạm (có thể cải tiến sau)

    return {question: q, options, correct};
  });
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function startQuiz() {
  quiz = shuffle([...questions]).slice(0, 40);
  renderQuiz();
  startTimer();
}

function renderQuiz() {
  const div = document.getElementById("quiz");
  div.innerHTML = "";

  quiz.forEach((q, i) => {
    let html = `<div class="question"><p>${q.question}</p>`;

    for (let key in q.options) {
      html += `
        <div class="answer">
          <input type="radio" name="q${i}" value="${key}">
          ${key}. ${q.options[key]}
        </div>`;
    }

    html += "</div>";
    div.innerHTML += html;
  });
}

function startTimer() {
  timer = setInterval(() => {
    time--;
    let m = Math.floor(time/60);
    let s = time%60;

    document.getElementById("timer").innerText =
      `⏳ ${m}:${s<10?"0":""}${s}`;

    if (time <= 0) submitQuiz();
  },1000);
}

function submitQuiz() {
  clearInterval(timer);

  let score = 0;

  quiz.forEach((q,i)=>{
    let selected = document.querySelector(`input[name="q${i}"]:checked`);
    let answers = document.querySelectorAll(`input[name="q${i}"]`);

    answers.forEach(a=>{
      let label = a.parentElement;

      if (a.value === q.correct) label.classList.add("correct");

      if (selected && a.value === selected.value && selected.value !== q.correct) {
        label.classList.add("wrong");
      }
    });

    if (selected && selected.value === q.correct) score++;
  });

  document.getElementById("result").innerText =
    `🎯 ${score}/40`;

  saveScore(score);
  drawChart();
}

function saveScore(score) {
  let history = JSON.parse(localStorage.getItem("scores")) || [];
  history.push(score);
  localStorage.setItem("scores", JSON.stringify(history));
}

function drawChart() {
  let history = JSON.parse(localStorage.getItem("scores")) || [];

  new Chart(document.getElementById("chart"), {
    type: 'line',
    data: {
      labels: history.map((_,i)=>`Lần ${i+1}`),
      datasets: [{
        label: 'Điểm',
        data: history
      }]
    }
  });
}
