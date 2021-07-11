const SERVER_URL = "/api";
const status_maps = ["OPRIT", "PAUZA", "PORNIT"];

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
let fetch_interval;
let temp_chart_instance = undefined;
let power_chart_instance = undefined;

function getData(path) {
  return new Promise(function(resolve, reject) {
    fetch(SERVER_URL + "/" + path, {
      method: "GET",
      headers: {
        'Authorization': password
      },
    }).then(function(res) {
      if (res.ok) {
        res.json().then(function(json) {
          resolve(json);
        });
      } else {
        reject(res.statusText);
      }
    }).catch(function(err) {
      reject(err);
    });
  });
}

function setData(path, data) {
  return new Promise(function(resolve, reject) {
    fetch(SERVER_URL + "/" + path, {
      method: "POST",
      body: data,
      headers: {
        'Authorization': password
      },
    }).then(function(res) {
      if (res.ok) {
        res.json().then(function(json) {
          resolve(json);
        });
      } else {
        reject(res.statusText);
      }
    }).catch(function(err) {
      reject(err);
    });
  });
}

function fetchData() {
  const requests = ["status", "current_temp", "min_temp", "max_temp", "work_time", "pause_time", "timeline", "timeline_temp", "timeline_power"];
  Promise.all(requests.map(path => getData(path))).then(function(results) {
    const resultObj = requests.reduce(function(acc, path, index) {
      acc[path] = results[index].result;
      return acc;
    }, {});
    if (Number(resultObj.status) === 0) {
      status_btn.innerHTML = "Porneste";
    } else {
      status_btn.innerHTML = "Opreste";
    }
    status_value.innerHTML = status_maps[Number(resultObj.status)] || "n/a";
    min_temp_value.innerHTML = resultObj.min_temp || "n/a";
    max_temp_value.innerHTML = resultObj.max_temp || "n/a";
    current_temp_value.innerHTML = resultObj.current_temp || "n/a";
    var dates = resultObj.timeline.slice(-1440);
    dates = dates.map(function(dt) {
      const [month, day, hour, min, sec] = dt.match(/..?/g);
      //const now = new Date();
      return `${month}/${day} ${hour}:${min}`;
    });
    var temp_values = resultObj.timeline_temp.slice(-1440);
    var power_values = resultObj.timeline_power.slice(-1440);
    if (temp_chart_instance) {
      temp_chart_instance.destroy();
    }
    if (power_chart_instance) {
      power_chart_instance.destroy();
    }
    temp_chart_instance = new Chart("temp_chart", {
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
    power_chart_instance = new Chart("power_chart", {
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
  }).catch(function(err) {
    console.log(err);
    clearInterval(fetch_interval);
    alert("Nu se poate comunica cu serverul!");
    auth_dialog.showModal();
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
  fetch_interval = setInterval(fetchData, 30000);
}

auth_dialog.querySelector(".submit").addEventListener('click', function() {
  auth_dialog.close();
  clearInterval(fetch_interval);
  password = auth_dialog.querySelector("#pass_input").value;
  fetchData();
  fetch_interval = setInterval(fetchData, 30000);
  window.localStorage?.setItem('pass', password);
});

status_btn.addEventListener('click', function() {
  const current = status_value.innerHTML;
  document.querySelector('#old_status_value').innerHTML = current;
  if (current == status_maps[0]) {
    document.querySelector('#new_status_value').innerHTML = status_maps[2];
  } else {
    document.querySelector('#new_status_value').innerHTML = status_maps[0];
  }
  status_dialog.showModal();
});
status_dialog.querySelector('.close').addEventListener('click', function() {
  status_dialog.close();
});
status_dialog.querySelector('.submit').addEventListener('click', function() {
  status_dialog.close();
  setData('state', 'test');
  fetchData();
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
  const current = parseFloat(document.querySelector("#min_input").value);
  setData('min_temp', current);
  fetchData();
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
  const current = parseFloat(document.querySelector("#max_input").value);
  setData('max_temp', current);
  fetchData();
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
