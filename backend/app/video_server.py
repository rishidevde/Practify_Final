import asyncio
import json
from collections import defaultdict
from typing import Dict, Set
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms: Dict[str, Set[str]] = defaultdict(set)
connections: Dict[str, WebSocket] = {}


async def get_local_ip():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connections[client_id] = websocket
    
    try:
        await websocket.send_text(json.dumps({
            "type": "connected",
            "client_id": client_id,
            "message": "Connected to signaling server"
        }))
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")
            
            if msg_type == "join":
                room_id = message.get("room_id")
                rooms[room_id].add(client_id)
                await websocket.send_text(json.dumps({
                    "type": "joined",
                    "room_id": room_id,
                    "peers": list(rooms[room_id])
                }))
                for peer_id in rooms[room_id]:
                    if peer_id != client_id and peer_id in connections:
                        await connections[peer_id].send_text(json.dumps({
                            "type": "peer_joined",
                            "peer_id": client_id
                        }))
            
            elif msg_type == "offer":
                target_id = message.get("target_id")
                if target_id in connections:
                    await connections[target_id].send_text(json.dumps({
                        "type": "offer",
                        "offer": message.get("offer"),
                        "from": client_id
                    }))
            
            elif msg_type == "answer":
                target_id = message.get("target_id")
                if target_id in connections:
                    await connections[target_id].send_text(json.dumps({
                        "type": "answer",
                        "answer": message.get("answer"),
                        "from": client_id
                    }))
            
            elif msg_type == "ice_candidate":
                target_id = message.get("target_id")
                if target_id in connections:
                    await connections[target_id].send_text(json.dumps({
                        "type": "ice_candidate",
                        "candidate": message.get("candidate"),
                        "from": client_id
                    }))
            
            elif msg_type == "leave":
                room_id = message.get("room_id")
                rooms[room_id].discard(client_id)
                for peer_id in rooms[room_id]:
                    if peer_id in connections:
                        await connections[peer_id].send_text(json.dumps({
                            "type": "peer_left",
                            "peer_id": client_id
                        }))
                rooms[room_id].discard(client_id)
                
    except WebSocketDisconnect:
        pass
    finally:
        if client_id in connections:
            del connections[client_id]
        for room_id in rooms:
            rooms[room_id].discard(client_id)


@app.get("/ip")
async def get_ip():
    local_ip = await get_local_ip()
    return {"ip": local_ip}


if __name__ == "__main__":
    import socket
    import time
    from datetime import datetime
    
    def get_local_ip():
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"
        finally:
            s.close()
    
    def get_all_ips():
        """Get all network interfaces"""
        import socket
        hostname = socket.gethostname()
        ips = []
        try:
            ips.append(("localhost", "127.0.0.1"))
            local_ip = get_local_ip()
            if local_ip != "127.0.0.1":
                ips.append(("Network IP", local_ip))
        except:
            pass
        return ips
    
    ip = get_local_ip()
    ips = get_all_ips()
    
    print("\n" + "="*60)
    print("VIDEO CALL SIGNALING SERVER")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("Connection URLs:")
    for name, addr in ips:
        print(f"   {name:15} -> ws://{addr}:8001/ws/{{client_id}}")
    print()
    print("Setup Instructions:")
    print(f"   1. Your IP Address:  {ip}")
    print(f"   2. Port:             8001")
    print(f"   3. Share IP + Room ID with your friend")
    print()
    print("For Windows & Mac connection:")
    print(f"   -> Share your IP: {ip}")
    print("   -> Friend enters IP in 'Custom Server IP' field")
    print("   -> Both share the same Room ID")
    print()
    print("Server Configuration:")
    print(f"   Host: 0.0.0.0 (listening on all interfaces)")
    print(f"   Port: 8001")
    print()
    print("Server is ready for connections!")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")