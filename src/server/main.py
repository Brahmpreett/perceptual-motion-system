import json 
import logging 

from fastapi 
import FastAPI, WebSocket, WebSocketDisconnect 
from fastapi.middleware.cors import CORSMiddleware 

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s") 
logger = logging.getLogger(__name__) 


app = FastAPI(title="AXIS Robot Server") 

app.add_middleware( 
	CORSMiddleware, 
	allow_origins=["*"], 
	allow_credentials=True, 
	allow_methods=["*"], 
	allow_headers=["*"], 
) 
@app.get("/health") 
async def health(): 
	return {"status": "ok"} 
@app.websocket("/ws") 
async def websocket_endpoint(websocket: WebSocket): 
	await websocket.accept() 
	logger.info("WebSocket client connected") 
	try: while True: raw = await websocket.receive_text() 
	try: 
		payload = json.loads(raw) 
	except json.JSONDecodeError: 
		payload = {"raw": raw} 
	logger.info("WS command: %s", payload) 
	await websocket.send_json({"status": "ok", "command": payload}) 
	except WebSocketDisconnect: logger.info("WebSocket client disconnected")