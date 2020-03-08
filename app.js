
		const body = document.getElementsByTagName('body')[0];
		const canvas = document.getElementById('board');
		const ctx = canvas.getContext('2d');
		const playerImg = document.getElementById('playerImg');

		const PLAYER_SIZE = 40;
		const PLAYER_SPEED = 2.5;
		const SHOW_FLOOR = 12;
		const FLOOR_SIZE = 150;
		const HIDE_FLOOR_SIZE = 75;
		const FLOOR_MINI_SIZE = 75;
		const WALL_SIZE = 20;
		const HIDE_RATE = 5;
		const NONE_RATE = 1;
		const ADD_SPEED_RANGE = 500;
		const SHORT_ROAD_RANGE = 50;
		const ADD_SPEED = 0.5;
		let player = {x:200,y:0,direct:'right'}
		let roads = [];
		let showIndex = 0;
		let power = 0;
		let jumpOrigin = null;
		let jumpTime = 0;
		let addPower = false;
		let currentY = 0;
		let gameOver = true;
		let score = 0;

		function cleanCanvas(){
			ctx.clearRect(0,0,canvas.width,canvas.height);
		}

		function paintWall(){
		  ctx.fillStyle='brown';
		  ctx.fillRect(0,0,WALL_SIZE,canvas.height);
		  ctx.fillRect(canvas.width-WALL_SIZE,0,WALL_SIZE,canvas.height);
		}

		function paintPower(){
		  ctx.fillStyle='darkgreen';
		  ctx.fillRect(WALL_SIZE,10,100,30);
		  ctx.fillStyle='green';
		  ctx.fillRect(WALL_SIZE,10,power,30);
		}

		function paintPlayer(){
			if(player.direct=='right'){
				ctx.drawImage(playerImg,player.x, toPaintY(player.y+PLAYER_SIZE+currentY),PLAYER_SIZE,PLAYER_SIZE); 
			}else{
				flipHorizontally(playerImg,player.x, toPaintY(player.y+PLAYER_SIZE+currentY),PLAYER_SIZE,PLAYER_SIZE);
			}
		}

		function flipHorizontally(img,x,y,size){ 
			ctx.translate(x+size,y); 
			ctx.scale(-1,1); 
			ctx.drawImage(img,0,0,size,size); 
			ctx.setTransform(1,0,0,1,0,0); 
		}

		function paintRoad(road){
		  ctx.fillStyle=road.color;
		  ctx.fillRect(road.x,toPaintY(road.y+currentY),road.width,10);
		}

		function paintRoads(){
			for(let i=showIndex;i<roads.length;i++){
			paintRoad(roads[i]);
		  }
		}

		function paintScore(){
		  ctx.font = "32px Arial";
		  ctx.fillStyle = "green";
		  ctx.textBaseline = "middle";
		  ctx.textAlign = "center";
		  ctx.fillText("SCORE:"+score, 300, 25);
		}

		function paintGameOver(){
			if(gameOver){
		  ctx.font = "60px Arial";
		  ctx.fillStyle = "red";
		  ctx.textBaseline = "middle";
		  ctx.textAlign = "center";
		  ctx.fillText("GAME OVER", 200, 350);
		  ctx.font = "32px Arial";
		  ctx.fillText("Space to start", 200, 400);
		  }
		}

		function init(){
		  //ctx.canvas.width  = window.innerWidth;
		  ctx.canvas.height = window.innerHeight;
		  player = {x:200,y:0,direct:'right'}
		  roads = [];
		  showIndex = 0;
		  power = 0;
		  jumpOrigin = null;
		  jumpTime = 0;
		  addPower = false;
		  currentY = 0;
		  gameOver = false;
		  score = 0;
			generateRoads();
		}

		function generateRoads(){
			roads = [];
			for(let i = 2;i<1000;i++){
			let rand =  Math.random()*10;
			if(rand<=NONE_RATE){
				continue;
			}
			let hideRoad = rand<=HIDE_RATE;
			let road = {
			x:Math.random()*100+(200*(i%2)),
			y:i*50,
			index:i,
			width:(hideRoad?HIDE_FLOOR_SIZE:FLOOR_SIZE)-parseInt(i/SHORT_ROAD_RANGE)*10,
			hide:hideRoad,
			color:hideRoad?'darkblue':'white'};
			if(road.width<FLOOR_MINI_SIZE){
				road.width = FLOOR_MINI_SIZE;
			}
			roads.push(road);
		  }
		}

		function playerMove(){
		  if(jumpOrigin!=null){
			let afterJumpX = jumpOrigin.x+(player.direct=='right'?200:-200)*(jumpOrigin.power)/100;
			let topJumpX = jumpOrigin.x+(player.direct=='right'?100:-100)*(jumpOrigin.power)/100;
			if(afterJumpX>=canvas.width-WALL_SIZE-PLAYER_SIZE){
				afterJumpX = canvas.width-WALL_SIZE-PLAYER_SIZE;
			}else if(afterJumpX<=0+WALL_SIZE){
				afterJumpX = 0+WALL_SIZE;
			}
			let p = getQuadraticBezierXYatT(jumpOrigin,{x:topJumpX,y:jumpOrigin.y+500*(jumpOrigin.power)/100},
			{x:afterJumpX,y:jumpOrigin.y},jumpTime);
			let touchRoad = null;
			if(jumpTime>0.5){
				touchRoad = checkTouchRoad(player,p);
			}else{
				if(toPaintY(player.y+currentY)<=200){
					currentY-=20;
				score = parseInt(Math.abs(currentY/5));
			  }
			}
			if(touchRoad!=null){
				player.x = p.x;
			  player.y = touchRoad.y;
			  jumpOrigin=null;
			}else{
			  player.x = p.x;             
			  player.y = p.y;
			  if(jumpTime>=1){
				jumpOrigin=null;
			  }
			}
		  }else{
			let originPlayer = {x:player.x,y:player.y};
			if(player.x>=canvas.width-WALL_SIZE-PLAYER_SIZE){
			  player.direct = 'left';
			}else if(player.x<=0+WALL_SIZE){
			  player.direct = 'right';
			}
			if(player.direct=='right'){
			  player.x+=PLAYER_SPEED+parseInt(score/ADD_SPEED_RANGE)*ADD_SPEED;
			}else{
			  player.x-=PLAYER_SPEED;+parseInt(score/ADD_SPEED_RANGE)*ADD_SPEED;
			}
			let afterPlayer = {x:player.x,y:player.y};
			let touchRoad = checkTouchRoad(originPlayer,afterPlayer);
			if(player.y>0&&touchRoad==null){
				player.y-=10;
				let touchRoad = checkTouchRoad(originPlayer,player);
			  if(touchRoad!=null){
				player.y=touchRoad.y;
			  }
			  if(player.y<0){
				player.y=0;
			  }
			}
			if(touchRoad!=null&&touchRoad.hide){
			  touchRoad.color = 'blue';
			}
		  }
		}

		function checkTouchRoad(originPoint,p){
				var touchRoad = null;
				for(let i=showIndex;i<roads.length;i++){
				let road = roads[i];
			  let roadY = road.y;
			  if((p.x>road.x-PLAYER_SIZE&&p.x<road.x+road.width)&&roadY<=originPoint.y && roadY>=p.y){
				touchRoad = road;
				break;
			  }
			  if(road.hide){
					road.color = 'darkblue';
			  }
			};
			return touchRoad;
		}

		function toPaintY(y){
			return canvas.height-(y);
		}

		function getQuadraticBezierXYatT(startPt,controlPt,endPt,T) { 
			var x = Math.pow(1-T,2) * startPt.x + 2 * (1-T) * T * controlPt.x + Math.pow(T,2) * endPt.x; 
			var y = Math.pow(1-T,2) * startPt.y + 2 * (1-T) * T * controlPt.y + Math.pow(T,2) * endPt.y; 
			return({x:x,y:y}); 
		} 


		function updateJumpTime(){
			jumpTime+=0.05;
			if(jumpTime<=1.05){
				setTimeout(updateJumpTime,1000/60);
		  }else{
			  jumpTime = 0;
		  }
		}

		function checkPower(){
			if(addPower){
			power+=3;
			if(power>100){
			  power = 0;
			}
		  }
		}

		function draw(){
		  cleanCanvas();
		  paintPlayer();
		  paintRoads();
		  paintWall();
		  paintPower();
		  paintScore();
		  paintGameOver();
		}

		function refresh(){
			updateData();
		  draw();
		}

		function updateData(){
			if(!gameOver){
			checkPower();
			playerMove();
			checkGameOver();
		  }
		}

		function checkGameOver(){
			if(player.y+currentY<-30){
			gameOver = true;
		  }
		}

		function controlPower(){
			if(gameOver){
				init();
			  }
			if(jumpOrigin==null){
				if(power==0){
				  power = 30;
				}
				addPower = true;
			  }
		}
		
		function jump(){
			addPower = false;
			if(jumpOrigin==null&&power>=30){
			jumpOrigin = {x:player.x,y:player.y,power:power};
			updateJumpTime();
		  }
		  power = 0;
		}

		body.addEventListener('keydown',(evt)=>{
			switch(evt.keyCode){
			case 32:  // space
				controlPower();
			break;
		  }
		});

		body.addEventListener('keyup',(evt)=>{
			switch(evt.keyCode){
			case 32: // space
				jump();
			break;
		  }
		});
		body.addEventListener('touchstart',(evt)=>{
			controlPower();
		});

		body.addEventListener('touchend',(evt)=>{
			jump();
		});


		setInterval(refresh,1000/60);