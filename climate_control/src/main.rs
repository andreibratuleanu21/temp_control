use std::net::UdpSocket;
use std::thread;
use std::path::{Path};
use std::fs::{File, OpenOptions};
use std::io::{prelude::*, SeekFrom};
use serde_json::json;
use serde::{Deserialize, Serialize};
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder, HttpRequest};

const DB_PATH: &str = "./db.json";

#[derive(Serialize, Deserialize)]
struct Config {
    password: String,
    file_type: String,
    current_temp: String,
    status: String,
    state: String,
    min_temp: String,
    max_temp: String,
    work_time: String,
    pause_time: String,
    timeline: Vec<String>,
    timeline_temp: Vec<String>,
    timeline_power: Vec<String>
}

#[get("/{key}")]
async fn get_status(web::Path(key): web::Path<String>, req: HttpRequest) -> impl Responder {
    let mut file = File::open(DB_PATH).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    let v: serde_json::Value = serde_json::from_str(&contents).unwrap();
    let password = match req.headers().get("authorization") {
        Some(data) => data.to_str().unwrap(),
        None => ""
    };
    if password != v["password"] || key == "password" {
        HttpResponse::Unauthorized().body("Unauthorized")
    } else {
        let data = json!({
            "result": v[key]
        });
        HttpResponse::Ok().body(data.to_string())
    }
}

#[post("/{key}")]
async fn set_status(web::Path(key): web::Path<String>, req_body: String, req: HttpRequest) -> impl Responder {
    let mut file = OpenOptions::new().read(true).write(true).open(DB_PATH).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    let mut v: serde_json::Value = serde_json::from_str(&contents).unwrap();
    let password = match req.headers().get("authorization") {
        Some(data) => data.to_str().unwrap(),
        None => ""
    };
    if password != v["password"] {
        HttpResponse::Unauthorized().body("Unauthorized")
    } else {
        v[key] = serde_json::Value::String(req_body.to_string());
        file.seek(SeekFrom::Start(0)).unwrap();
        let result = serde_json::to_string(&v).unwrap();
        let bytes = result.as_bytes();
        let bytes_len: u64 = bytes.len() as u64;
        file.write_all(bytes).unwrap();
        file.set_len(bytes_len).unwrap();
        let data = json!({
            "result": "ok"
        });
        HttpResponse::Ok().body(data)
    }
}

fn udp_server() {
    let socket = UdpSocket::bind("0.0.0.0:7777").unwrap();
    println!("UDP socket started!");
    let mut buf = [0; 32];
    loop {
        let sock = socket.try_clone().unwrap();
        match socket.recv_from(&mut buf) {
            Ok((amt, src)) => {
                let con_id = src.to_string();
                let cmd = buf[0];
                println!("Received {} bytes from {}", amt, con_id);
                let mut file = OpenOptions::new().read(true).write(true).open(DB_PATH).unwrap();
                let mut contents = String::new();
                file.read_to_string(&mut contents).unwrap();
                let mut v: Config = serde_json::from_str(&contents).unwrap();
                match cmd {
                    1 => {
                        let result = format!("{}:{}:{}:{}", v.min_temp, v.max_temp, v.work_time, v.pause_time);
                        sock.send_to(result.as_bytes(),  &src).expect("Failed to send");
                    },
                    2 => {
                        /*match buf[1] {
                            1 => {sock.send_to(v["min_temp"].as_bytes(),  &src).expect("Failed to send");},
                            2 => {sock.send_to(v["max_temp"].as_bytes(),  &src).expect("Failed to send");},
                            3 => {sock.send_to(v["work_time"].as_bytes(),  &src).expect("Failed to send");},
                            4 => {sock.send_to(v["pause_time"].as_bytes(),  &src).expect("Failed to send");},
                            _ => println!("Invalid cmd"),
                        }
                        */
                        println!("GET SMTH");
                    },
                    3 => {
                        /*match buf[1] {
                            1 => {sock.send_to(v["min_temp"],  &src).expect("Failed to send");},
                            2 => {sock.send_to(v["max_temp"],  &src).expect("Failed to send");},
                            3 => {sock.send_to(v["work_time"],  &src).expect("Failed to send");},
                            4 => {sock.send_to(v["pause_time"],  &src).expect("Failed to send");},
                            _ => println!("Invalid cmd");
                        }*/
                        println!("SET SMTH");
                    },
                    4 => {
                        let time = String::from_utf8_lossy(&buf[1..11]).to_string();
                        let temp = String::from_utf8_lossy(&buf[11..16]).to_string();
                        let power = String::from_utf8_lossy(&buf[16..17]).to_string();
                        v.timeline.push(time);
                        if v.timeline.len() > 276480 {
                            v.timeline.remove(0);
                        }
                        v.timeline_temp.push(temp);
                        if v.timeline_temp.len() > 276480 {
                            v.timeline_temp.remove(0);
                        }
                        v.timeline_power.push(power);
                        if v.timeline_power.len() > 276480 {
                            v.timeline_power.remove(0);
                        }
                        v.current_temp = String::from_utf8_lossy(&buf[11..16]).to_string();
                        v.status = String::from_utf8_lossy(&buf[16..17]).to_string();
                        file.seek(SeekFrom::Start(0)).unwrap();
                        let result = serde_json::to_string(&v).unwrap();
                        let bytes = result.as_bytes();
                        let bytes_len: u64 = bytes.len() as u64;
                        file.write_all(bytes).unwrap();
                        file.set_len(bytes_len).unwrap();
                        if buf[17] == 49 {
                            let result = format!("{}:{}:{}:{}", v.min_temp, v.max_temp, v.work_time, v.pause_time);
                            sock.send_to(result.as_bytes(),  &src).expect("Failed to send");
                        }
                    },
                    _ => println!("Invalid cmd"),
                }
            },
            Err(err) => {
                eprintln!("Err: {}", err);
            }
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    if Path::new(DB_PATH).exists() == false {
        println!("No db file. Creating...");
        let mut file = File::create(DB_PATH)?;
        let conf = Config {
            password: "1234".to_owned(),
            current_temp: String::new(),
            state: String::new(),
            status: String::new(),
            file_type: "climate_control_db".to_owned(),
            min_temp: "2.1".to_owned(),
            max_temp: "5.1".to_owned(),
            work_time: "10800".to_owned(),
            pause_time: "3600".to_owned(),
            timeline: Vec::new(),
            timeline_temp: Vec::new(),
            timeline_power: Vec::new()
        };
        let init = serde_json::to_string(&conf).unwrap();
        file.write_all(init.as_bytes())?;
    }
    thread::spawn(|| {
        udp_server()
    });
    HttpServer::new(|| {
        App::new()
            .service(get_status)
            .service(set_status)
    })
    .bind("127.0.0.1:7777")?
    .run()
    .await
}
