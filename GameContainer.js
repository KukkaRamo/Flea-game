'use strict';

const GoldButtonStyle = {
	height:50, width:50, background:'#D4AF37', borderRadius: 15
};
const ForestButtonStyle = {
	height: 20, width: 40, borderColor: '#9B7855'
};
const BoardDivStyle = {
	margin: 20, padding: 40, borderColor: '#9B7855'
};
const goodWeatherColor = '#2D95FF';
const badWeatherColor = '#DDDDDD';

var Stage = Object.freeze( {"initial":1, "playing":2, "waitResult":3, "inPenalty":4, "treasureFound":5 });
var SquareState = Object.freeze( {"waiting":1, "inForest":2, "currentLocation":3, "correctAnswer":4, "intactWrongAnswer":5, "up":6, "down":7 });

var colorMap = new Map();
colorMap.set(SquareState.waiting,'#199919');
colorMap.set(SquareState.inForest,'#199919');
colorMap.set(SquareState.up,'#A9A9A9');
colorMap.set(SquareState.down,'#483D8B');
colorMap.set(SquareState.currentLocation,'#DA6019');
colorMap.set(SquareState.intactWrongAnswer,'#FFFFF0');
colorMap.set(SquareState.correctAnswer,'#FFFFF0');

class Square extends React.Component {
	constructor(props) {
		super(props);
		var currentColor = colorMap.get(this.props.myState);
		this.state = {
			bgColor:currentColor
		};
		this.updateMe = this.updateMe.bind(this);
	}
	
	updateMe() {
		if (this.props.boardState == Stage.initial) {
			var c = colorMap.get(SquareState.waiting);
			this.setState({bgColor: c});
			this.props.onChange(SquareState.initial);
		}
		else if (this.props.boardState == Stage.playing)
		{
			if (this.props.myState == SquareState.correctAnswer || 
			  this.props.myState == SquareState.intactWrongAnswer) {
				var newAction;
				if (this.props.myState == SquareState.correctAnswer) {
					newAction = SquareState.current;
				}
				else {
					if (this.props.value > this.props.targetValue)
						newAction = SquareState.up;
					else if(this.props.value < this.props.targetValue)
						newAction = SquareState.down;
				}
				var c = colorMap.get(newAction);
				this.setState({bgColor: c});
				this.props.onChange(newAction);
			}
		}
	}	

	render() {
		var myBackground = (this.props.penalty) ? this.state.bgColor : colorMap.get(this.props.myState);
		var myStyle1 = {background: myBackground};
		var style2 = Object.assign({},ForestButtonStyle,myStyle1);
		return (
			<button className="squareButton" style = {style2} onClick={this.updateMe}>
				{this.props.value}
			</button>
		);
	}
}

class Board extends React.Component {
	
	constructor(props) {
		super(props);
		this.dims =
		{
			myWidth: 20,
			myHeight: 20,
		};
		this.weatherColor = badWeatherColor;

		this.OpacityLowerLimit = 0.3;
		this.OpacityDecrementStep = 0.05;
		this.OpacityElapsingStep = 0.01;
		this.state = { 
			calculationDistance: 3,
			minValueOp1: 0, 
			maxValueOp1: 50,
			minValueOp2: 0, 
			maxValueOp2: 50,
			myOperator: '+',
			xPos: this.dims.myWidth - 1,
			yPos: this.dims.myHeight - 1,
			firstOperand:0,
			secondOperand: 0,
			targetValue: 0,
			targetX:this.dims.myWidth - 1,
			targetY:this.dims.myHeight - 1,
			squares: Array(this.dims.myHeight).fill(Array(this.dims.myWidth).fill(0)),
			background: this.badWeatherColor,
			opacity:1,
			ticks:0,
			penalty:0,
			gameState: Stage.initial
		};
		
		this.jumpedListener = this.jumpedListener.bind(this);
		this.updateNumbers = this.updateNumbers.bind(this);
		this.handleOperatorChange = this.handleOperatorChange.bind(this);
	}
	
	tick()
	{
		var myOpacity = this.state.opacity;
		if (myOpacity > this.OpacityLowerLimit)
			myOpacity -= this.OpacityElapsingStep;
		else this.weatherColor = goodWeatherColor;
		this.setState({ticks: this.state.ticks + 1, opacity: myOpacity, background: this.weatherColor});
	}
	
	setTotalTimer () {
		this.totalInterval = setInterval(() => this.tick(), 1000);
	}
	
	clearTotalTimer() {
		clearInterval(this.totalInterval);
		alert ("Total time " + this.state.ticks);
	}
	
	clearPenalty() {
		this.setState({penalty: 0, gameState: Stage.playing});
		clearInterval(this.interval);
	}
	
	jumpedListener(clickedElementState) {
		if (this.state.gameState == Stage.initial || this.state.gameState == Stage.playing) {
			var myPenalty = 0;
			switch (clickedElementState)
			{	
				case(SquareState.down):
				myPenalty = 2000;
				case(SquareState.up):
				myPenalty += 3000;
				var myOpacity = this.state.opacity;
				if (myOpacity > this.OpacityLowerLimit)
					myOpacity -= this.OpacityDecrementStep;
				this.setState({penalty: myPenalty, gameState: Stage.inPenalty, opacity: myOpacity});
				this.interval = setInterval(() => this.clearPenalty(), myPenalty);
				break;
				case (SquareState.initial):
				this.setTotalTimer();
				default:
				this.updateNumbers();
			}
		}
	}
	
	componentDidMount() {
		 ReactDOM.findDOMNode(this).addEventListener 
		("jumped", this.jumpedListener );
	}
	
	componentWillUnmount() {
		ReactDOM.findDOMNode(this).removeEventListener("jumped", this.jumpedListener);
	}
  
	buildCurrentData()
	{
		var min1 = this.state.minValueOp1; var max1 = this.state.maxValueOp1;
		var min2 = this.state.minValueOp2; var max2 = this.state.maxValueOp2;
		if (min1 > max1 || min2 > max2) {
			alert ("lower limits should not be > upper limits");
		}
		var myFirstOperand = this.getNewOperand(min1, max1);
		var myData = myFirstOperand;
		var mySecondOperand = this.getNewOperand(min2, max2);
		var resMin, resMax;
		switch (this.state.myOperator)
		{
		case '+':
			myData += mySecondOperand;
			resMin = min1 + min2;
			resMax = max1 + max2;
			break;
		case '-':
			myData -= mySecondOperand;
			resMin = Math.min(min1 - max2, min2 - max1);
			resMax = Math.min(max1 - min2, max2 - min1);
			break;
		case '*':
			myData *= mySecondOperand;
			resMin = Math.min(Math.min(Math.min(min1 * min2, min1 * max2),max1 * min2),max1 * max2);
			resMax = Math.max(Math.max(Math.max(min1 * min2, min1 * max2),max1 * min2),max1 * max2);
			break;
		}
		var myXPos = this.state.targetX;
		var myYPos = this.state.targetY;
		var myTargetX = myXPos - Math.floor(Math.random() * this.state.calculationDistance) - 1;
		myTargetX = Math.max(myTargetX, 0);
		var myTargetY = myYPos - Math.floor(Math.random() * this.state.calculationDistance) - 1;
		myTargetY = Math.max(myTargetY, 0);
		if (myTargetX==0 || myTargetY==0) 
		{
			this.setState({gameState: Stage.treasureFound});
			alert("You have found the treasure");
			this.clearTotalTimer();
		}
		else {
			var newSquares = new Array();
			var i,j,w;
			for (i=0; i<this.dims.myHeight; ++i)
			{
				w = new Array();
				for (j=0; j<this.dims.myWidth; ++j)
				{
					w.push(
						(i == myTargetX && j == myTargetY)
							? myData
							: this.generateBoardNumber(myData, resMin, resMax)
						);
				}	
				newSquares[i]=Array.from(w);
			}
			this.setState({firstOperand: myFirstOperand, secondOperand: mySecondOperand, targetValue: myData, 
				xPos: myXPos, yPos: myYPos, targetX: myTargetX, targetY: myTargetY, squares: newSquares, gameState:Stage.playing});
		}
	}


	getNewOperand(myMin, myMax)
	{
		var number = myMin + Math.floor((Math.random() * (myMax - myMin)));
		return number;
	}

	generateBoardNumber(current, myMin, myMax)
	{
		var number = myMin + Math.floor((Math.random() * (myMax - myMin - 1)));
		if (number >= current)
			++number;
		return number;
	}

	updateNumbers()
	{
		this.setState({gameState: Stage.waitResult});
		this.buildCurrentData();
	}

	isCorrectLocation( x,  y)
	{
		return x == this.state.xPos && y == this.state.yPos;
	}
  
  
	renderSquare(i,j) {
		var outsideActiveArea = (i >= this.state.xPos || i < this.state.xPos-this.state.calculationDistance 
		|| j >= this.state.yPos || j < this.state.yPos-this.state.calculationDistance);
		var target = (i==this.state.targetX && j == this.state.targetY);
		
		return <Square key={i*this.dims.myWidth + j} value={this.state.squares[i][j]} 
		targetValue={this.state.targetValue} 
		myState = {(this.state.gameState == Stage.initial) ? SquareState.waiting :	
			(i==this.state.xPos && j==this.state.yPos) ? SquareState.currentLocation : 
			(target) ? SquareState.correctAnswer :			
			(outsideActiveArea) ? SquareState.inForest : SquareState.intactWrongAnswer} 
		boardState={this.state.gameState} 
		penalty={this.state.penalty} onChange={this.jumpedListener}/>;
	}
  
	renderGoldButton() {
		var myStyle = {opacity: this.state.opacity};
		var style2 = Object.assign({},GoldButtonStyle,myStyle);
		return <div className="treasure"><button id="gold" style = {style2} >
			</button></div>
	}
	
	handleOperatorChange (changeEvent) {
		if (this.state.gameState==Stage.initial) {
			this.setState({
				myOperator: changeEvent.target.value
			});
		}
	}

	render() {
		var myHeights = this.dims.myHeight;
		var heights = Array.from({length: myHeights}, (x,i) => i);
		var myWidths = this.dims.myWidth
		var widths = Array.from({length: myWidths}, (x,i) => i);
		var myBackground = (this.props.penalty) ? this.state.bgColor : colorMap.get(this.props.myState);
		var myStyle = {background: this.state.background};
		var style2 = Object.assign({},BoardDivStyle,myStyle);
		return (
			<div style = {style2}>
				<table cellpadding="10"> <tr> <td >
					<div className="status">First operand {this.state.firstOperand}</div>
					<div className="status">{this.state.myOperator}</div>
					<div className="status">Second operand {this.state.secondOperand}</div>
				</td><td>
					<div className="radio">
						<label>
							<input type="radio" value="+" checked={this.state.myOperator=='+'} onChange={this.handleOperatorChange}/>
							+
						</label>
					</div>
					<div className="radio">
						<label>
							<input type="radio" value="-" checked={this.state.myOperator=='-'} onChange={this.handleOperatorChange}/>
							-
						</label>
					</div>
					<div className="radio">
						<label>
							<input type="radio" value="*" checked={this.state.myOperator=='*'} onChange={this.handleOperatorChange}/>
							*
						</label>
					</div>
				</td></tr></table>
				<div> <hr /> </div>
				{this.renderGoldButton()}
				<div> <br /> </div>
				{heights.map(
					(x) => 
					<div className="board-row">
						{widths.map(
							(y) => 
							this.renderSquare(x,y)
						)}
					</div>	
				)}
			</div>
		);
	}
}

class Game extends React.Component {
	render() {
		return (
			<div className="game">
				<div className="game-board" id="fleaBoard">
					<Board />
				</div>
				<div className="game-info">
					<br />
					<h1>Rules</h1>
					<div>
						You are a brownish flea in the green forest.  There is a golden treasure, 
						and you will find it when you get outside the forest.
						However, the weather is bad at first, and chemicals make the treasure
						dimmer and dimmer all the time.
						  
						The dimmering stops when you reach the treasure or the weather gets better.
						You get out of the forest by jumping forward towards the upper left corner 
						every time when there is a new calculation.  You should jump into the square 
						in the purple area that contains the correct result for the calculation.
						  
						Your goal is to get out as soon as possible.  The time ticks all the time.  
						Moreover, if you jump into a wrong result, you get a penalty before you get 
						a new calculation.  If you jump into a square that has too high a number, 
						you loose some time on a gray rock.  If the result is too low, you loose 
						time in bluish ground water pond.
						  
						To start the game, click any square in the green forest.  To start the game
						 again, re-load the page.
					</div>
				</div>
			</div>
		);
	}
}

const domContainer = document.querySelector('#GameContent');
ReactDOM.render(React.createElement(Game), domContainer);
