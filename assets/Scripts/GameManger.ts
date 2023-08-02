import { _decorator, Component, Node, NodeEventType, EventTouch, UITransform, Button, director } from 'cc';
import { CarMove } from './CarMove';
const { ccclass, property } = _decorator;

@ccclass('GameManger')
export class GameManger extends Component {
    static instance: GameManger = null;

//Button
    @property(Node)
    startBtn: Node = null;
//Car
    @property(Node)
    car1: Node = null;
    @property(Node)
    car2: Node = null;
    @property(Node)
    car3: Node = null;
//Any
    @property(Node)
    canvas: Node = null;
    @property(Node)
    completeNode: Node = null;
    @property
    sceneName: string = '';
//Array
    public carsArray: Node [] = [];
    public carsAliveArray: Node [] = [];
    public saveLines: number [] = [];
//private
    private carSelected: Node = null;

    protected onLoad(): void {
        GameManger.instance = this;

        this.carsArray.push(this.car1);
        this.carsArray.push(this.car2);
        this.carsArray.push(this.car3);

        this.canvas.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
        this.canvas.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
        this.canvas.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch){
        for(let car of this.carsAliveArray) {
            if(car.getComponent(UITransform).getBoundingBoxToWorld().contains(event.getUILocation())) {
                console.log("touch car", car.name);
                this.carSelected = car;
                
                this.carSelected.getComponent(CarMove).onTouchStart(event);
                break;
            }
        }
    }

    onTouchMove(event: EventTouch){
        if(this.carSelected) {
            this.carSelected.getComponent(CarMove).onTouchMove(event);
        }
    }

    onTouchEnd(){
        if(this.carSelected) {
            this.carSelected.getComponent(CarMove).onTouchEnd();
        }
    }



    start() {
        this.checkCarAlive();
        let startBtn = this.startBtn.getComponent(Button);
        startBtn.node.on('click', this.onClick, this);
    }
    update(deltaTime: number) {
        
    }

    checkCarAlive(){
        for(let cars of this.carsArray){
            
            if(cars){
                this.carsAliveArray.push(cars);
                cars.getComponent(CarMove).startFunc();
            }
        }
    }

    checkConnectedLine(){
        if(this.carsAliveArray.length == this.saveLines.length){
            this.startBtn.active = true;
        }
    }

    onClick(){
        this.startBtn.active = false;    
        for(let cars of this.carsAliveArray){
            cars.getComponent(CarMove).startFunc();
            cars.getComponent(CarMove).isAngleOyAtive = true;
            cars.getComponent(CarMove).carMove();
        }
    }
    
    checkCompleteLv() {
        for(let cars of this.carsAliveArray){
            let carComp = cars.getComponent(CarMove);
            if (!carComp.carArrived) {
                return;
            }
        }
        this.completeNode.active = true;
    }
    reloadScene(){
        director.loadScene(this.sceneName);
    }
    checkContact(){
        for(let cars of this.carsAliveArray){
            if(cars.getComponent(CarMove).carContact){
                cars.getComponent(CarMove).destroyCar.active = true;
                cars.getComponent(CarMove).stopFunc();
                this.scheduleOnce(this.reloadScene, 2.2);
                return; 
            }
            let carCont = cars.getComponent(CarMove);
            // if(carCont.carContact){
            //     carCont.destroyCar.active = true;
            //     carCont.stopFunc();
            //     // this.scheduleOnce(this.reloadScene, 2.2);
            //     return; 
            // }
            
        }
        this.carContact();
    }
    carContact(){
        CarMove.instance.destroyCar.active = true;
        CarMove.instance.stopFunc();
        this.scheduleOnce(this.reloadScene, 2.2);
    }
}


