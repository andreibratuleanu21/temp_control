use std::net::UdpSocket;
use std::thread;
use std::path::{Path};
use std::fs::{File, OpenOptions};
use std::io::{prelude::*, SeekFrom};
use serde_json::json;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};

const DB_PATH: &str = "./db.json";

#[get("/{key}")]
async fn get_status(web::Path(key): web::Path<String>) -> impl Responder {
    let mut file = File::open(DB_PATH).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    let v: serde_json::Value = serde_json::from_str(&contents).unwrap();
    let data = json!({
        "result": v[key]
    });
    HttpResponse::Ok().body(data.to_string())
}

#[post("/{key}")]
async fn set_status(web::Path(key): web::Path<String>, req_body: String) -> impl Responder {
    println!("request: {}", req_body);
    let mut file = OpenOptions::new().read(true).write(true).open(DB_PATH).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    let mut v: serde_json::Value = serde_json::from_str(&contents).unwrap();
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

fn udp_server() {
    let socket = UdpSocket::bind("0.0.0.0:7777").unwrap();
    println!("UDP socket started!");
    let mut buf = [0; 4096];
    loop {
        let sock = socket.try_clone().unwrap();
        match socket.recv_from(&mut buf) {
            Ok((amt, src)) => {
                let con_id = src.to_string();
                let cmd = buf[0];
                println!("Received from {} cmd {} size {}", con_id, cmd, amt);
                sock.send_to(&[1, 85], &src).expect("Failed to send");
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
        file.write_all(b"{\"fileType\": \"climate_control_db\"}")?;
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
