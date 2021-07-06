const status_value = document.querySelector("#status_value");
const min_temp_value = document.querySelector("#min_temp_value");
const max_temp_value = document.querySelector("#max_temp_value");
const current_temp_value = document.querySelector("#current_temp_value");

const status_dialog = document.querySelector('#status_dialog');
const min_temp_dialog = document.querySelector('#min_temp_dialog');
const max_temp_dialog = document.querySelector('#max_temp_dialog');
const advanced_dialog = document.querySelector('#advanced_dialog');
const auth_dialog = document.querySelector('#auth_dialog');

const status_btn = document.querySelector('#status_btn');
const min_temp_btn = document.querySelector('#min_temp_btn');
const max_temp_btn = document.querySelector('#max_temp_btn');
const advanced_btn = document.querySelector('#advanced_btn');

let password = window.localStorage?.getItem('pass') || "";

function fetchData() {
  status_btn.innerHTML = "Opreste";
  status_value.innerHTML = "Stationare";
  min_temp_value.innerHTML = "0.1";
  max_temp_value.innerHTML = "5.1";
  current_temp_value.innerHTML = "3.2";
  var dates = [50,60,70,80,90,100,110,120,130,140,150];
  var temp_values = [7,8,8,9,9,9,10,8,6,3,-1];
  var power_values = [0,0,0,0,0,0,0,10,6,6,5];

  new Chart("temp_chart", {
    type: "line",
    data: {
      labels: dates,
      datasets: [{
        label: "Temperatura",
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(255,0,0,1.0)",
        borderColor: "rgba(255,0,0,0.75)",
        data: temp_values
      }]
    }
  });
  new Chart("power_chart", {
    type: "line",
    data: {
      labels: dates,
      datasets: [{
        label: "Energie",
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(0,0,255,1.0)",
        borderColor: "rgba(0,0,255,0.75)",
        data: power_values
      }]
    }
  });

}

if (!status_dialog.showModal) {
  dialogPolyfill.registerDialog(status_dialog);
}
if (!min_temp_dialog.showModal) {
  dialogPolyfill.registerDialog(min_temp_dialog);
}
if (!max_temp_dialog.showModal) {
  dialogPolyfill.registerDialog(max_temp_dialog);
}
if (!advanced_dialog.showModal) {
  dialogPolyfill.registerDialog(advanced_dialog);
}
if (!auth_dialog.showModal) {
  dialogPolyfill.registerDialog(auth_dialog);
}

if (!password) {
  auth_dialog.showModal();
} else {
  fetchData();
}

auth_dialog.querySelector(".submit").addEventListener('click', function() {
  password = auth_dialog.querySelector("#pass_input").value;
  fetchData();
  window.localStorage?.setItem('pass', password);
  auth_dialog.close();
});

status_btn.addEventListener('click', function() {
  const current = status_value.innerHTML;
  document.querySelector('#old_status_value').innerHTML = current;
  if (current == "Oprit") {
    document.querySelector('#new_status_value').innerHTML = "Pornit";
  } else {
    document.querySelector('#new_status_value').innerHTML = "Oprit";
  }
  status_dialog.showModal();
});
status_dialog.querySelector('.close').addEventListener('click', function() {
  status_dialog.close();
});
status_dialog.querySelector('.submit').addEventListener('click', function() {
  status_dialog.close();
});

min_temp_btn.addEventListener('click', function() {
  const current = parseFloat(min_temp_value.innerHTML);
  document.querySelector("#min_input").value = current;
  min_temp_dialog.showModal();
});
min_temp_dialog.querySelector('.close').addEventListener('click', function() {
  min_temp_dialog.close();
});
min_temp_dialog.querySelector('.submit').addEventListener('click', function() {
  min_temp_dialog.close();
});
min_temp_dialog.querySelector("#plus_min_input").addEventListener('click', function() {
  const current = parseFloat(document.querySelector("#min_input").value);
  document.querySelector("#min_input").value = (current + 0.1).toFixed(1);
});
min_temp_dialog.querySelector("#minus_min_input").addEventListener('click', function() {
  const current = parseFloat(document.querySelector("#min_input").value);
  document.querySelector("#min_input").value = (current - 0.1).toFixed(1);
});

max_temp_btn.addEventListener('click', function() {
  const current = parseFloat(max_temp_value.innerHTML);
  document.querySelector("#max_input").value = current;
  max_temp_dialog.showModal();
});
max_temp_dialog.querySelector('.close').addEventListener('click', function() {
  max_temp_dialog.close();
});
max_temp_dialog.querySelector('.submit').addEventListener('click', function() {
  max_temp_dialog.close();
});
max_temp_dialog.querySelector("#plus_max_input").addEventListener('click', function() {
  const current = parseFloat(document.querySelector("#max_input").value);
  document.querySelector("#max_input").value = (current + 0.1).toFixed(1);
});
max_temp_dialog.querySelector("#minus_max_input").addEventListener('click', function() {
  const current = parseFloat(document.querySelector("#max_input").value);
  document.querySelector("#max_input").value = (current - 0.1).toFixed(1);
});

advanced_btn.addEventListener('click', function() {
  advanced_dialog.showModal();
});
advanced_dialog.querySelector('.close').addEventListener('click', function() {
  advanced_dialog.close();
});
advanced_dialog.querySelector('.submit').addEventListener('click', function() {
  advanced_dialog.close();
});
