import { _decorator, Component, Graphics, director, EPhysics2DDrawFlags, lerp, Node, Collider2D, Contact2DType, tween, PhysicsSystem2D, UITransform, EventTouch, Vec2, Vec3 } from 'cc';
import { GameManger } from './GameManger';
const { ccclass, property } = _decorator;

@ccclass('CarMove')
export class CarMove extends Component {
    static instance: CarMove = null;

    @property(Node)
    car: Node = null;
    @property(Node)
    park: Node = null;
    @property(Node)
    canvas: Node = null;
    @property(Graphics)
    line: Graphics = null;
    @property(Node)
    destroyCar: Node = null;
    @property
    distanceBtw2P: number = 2;
    @property
    sceneName: string = '';

    listPoints: Vec2[] = [];

    public isAngleOyAtive: boolean = false;
    public active: boolean = false;
    public saveLine: number = null;
    public velocity = 250;
    public currentPos = 0;
    public currentAngle: number = null;
    public pointCounter: number = 0;
    public maxPointInterval: number = 7;
    public ratio: number = 0.5;
    public carArrived: boolean = false;
    public carContact: boolean = false;

    protected onLoad(): void {
        PhysicsSystem2D.instance.gravity = Vec2.ZERO;
        // PhysicsSystem2D.instance.enable = true;
        // PhysicsSystem2D.instance.debugDrawFlags  = EPhysics2DDrawFlags.Aabb |
        // EPhysics2DDrawFlags.Pair |
        // EPhysics2DDrawFlags.CenterOfMass |
        // EPhysics2DDrawFlags.Joint |
        // EPhysics2DDrawFlags.Shape;

        CarMove.instance = this;
    }
    start() {
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }
    update(deltaTime: number) {
        
    }
    reloadScene(){
        director.loadScene(this.sceneName);
    }
//xử lý va chạm.
    onBeginContact(){
        this.carContactFunc();
    }
    onEndContact(){

    }
    carContactFunc(){
        this.carContact = true;
        GameManger.instance.carDestroy.play();
        GameManger.instance.checkContact();
    }
//Start/Move/End
    startFunc(){
        this.active = true;
    }
    stopFunc(){
        this.active = false;
    }
    onTouchStart(event: EventTouch){
        if(!this.active){
            return;
        }
        
        this.listPoints = [];
        let wp = event.touch.getUILocation();
        let _currentPos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(wp.x, wp.y));
        let currentPos = new Vec2(_currentPos.x, _currentPos.y);
        this.listPoints.push(currentPos);
        
        console.log('TouchPos1', _currentPos);
    }
    onTouchMove(event: EventTouch){
        if(!this.active){
            return;
        }
        let wp = event.touch.getUILocation();
        let _currentPos = this.line.node.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(wp.x, wp.y));
        let currentPos = new Vec2(_currentPos.x, _currentPos.y);
        this.pointCounter++;
        if (this.pointCounter >= this.maxPointInterval) {
            this.listPoints.push(currentPos);

            this.pointCounter = 0;
        }
        this.line.moveTo(this.listPoints[0].x, this.listPoints[0].y);
        this.renderLine();
    }
    onTouchEnd(){
        if(!this.active){
            return;
        }
        let lastPoint = this.listPoints[this.listPoints.length - 1];
        let parkPos = new Vec2(this.park.position.x, this.park.position.y);
        let lastPointPos = new Vec2(lastPoint);
        this.saveLine = Vec2.distance(lastPointPos, parkPos);
        console.log(this.saveLine);
        if(this.saveLine <= 50){
            GameManger.instance.saveLines.push(this.saveLine);
        }
        console.log("onTouchEnd", this.listPoints)
        GameManger.instance.checkConnectedLine();
    }

    renderLine(){
        let lastIndex = 0;
        for(let i=1; i < this.listPoints.length; i++){
            let lastPos = this.listPoints[lastIndex];
            let currentPos = this.listPoints[i];

            let distance = Vec2.distance(lastPos, currentPos);

            if(distance > this.distanceBtw2P){
                this.line.lineTo(currentPos.x, currentPos.y);
                lastIndex = i;
            }
        }
        this.line.stroke();
    }

    angleOy(point1: Vec3, point2: Vec3): number {
        if (!this.isAngleOyAtive) {
            return;
        }
        let deltaY = point2.y - point1.y;
        let deltaX = point2.x - point1.x;
        let angleRad = Math.atan2(deltaY, deltaX);
        let angleDeg = 90 + (angleRad * (180.0 / Math.PI));
        return angleDeg;

    }
//option1: xe di chuyển liên tiếp theo các điểm trong mảng listPoints với một thời gian nhất định (xoay hướng xe chưa tối ưu)
    moveToNextPoint(nextAnglePos: Vec3, nextMovePos: Vec3) {
        if(!this.active){
            return;
        }
        if((this.currentPos + 4) == (this.listPoints.length -1)){
            this.scheduleOnce(GameManger.instance.reloadScene, 1.5);
            return;
        }

        let anglePos = new Vec3(this.listPoints[this.currentPos].x, this.listPoints[this.currentPos].y, 0);
        let angle = this.angleOy(anglePos, nextAnglePos);
        let nextNextAnglePos = new Vec3(this.listPoints[this.currentPos + 4].x, this.listPoints[this.currentPos + 4].y, 0);
        let nextAngle = this.angleOy(anglePos, nextNextAnglePos);
        let rotateAngle = lerp(angle, nextAngle, this.ratio);
        this.car.setRotationFromEuler(new Vec3(0, 0, rotateAngle));
        this.currentPos += 1;
        let nextNextMovePos = new Vec3(this.listPoints[this.currentPos + 2].x, this.listPoints[this.currentPos + 2].y, 0);
        let distance = Vec3.distance(nextMovePos, nextNextMovePos);
        let moveTime = distance / this.velocity;
        tween(this.car)
            .to(moveTime, { position: nextAnglePos })
            .call(() => {
                let car = this.car.position;
                let park = this.park.position;
                let distance = Vec2.distance(car, park);
                let angle = this.angleOy(car, park);
                if(distance <= 25 && angle <=30){   
                    this.carArrivedFunc();
                    this.car.setRotationFromEuler(new Vec3(0, 0, 0));
                    this.isAngleOyAtive = false;
                    this.stopFunc();
                }else if(distance <= 25 && angle > 30){
                    this.stopFunc();
                    this.isAngleOyAtive = false;
                    this.scheduleOnce(GameManger.instance.reloadScene, 1.5);
                }
                let nextNextMovePos = new Vec3(this.listPoints[this.currentPos + 1].x, this.listPoints[this.currentPos + 1].y, 0);
                let nextNextAnglePos = new Vec3(this.listPoints[this.currentPos + 3].x, this.listPoints[this.currentPos + 3].y, 0);
                this.moveToNextPoint(nextNextAnglePos, nextNextMovePos);
            })
            .start();
    }
    carMove(){
        if(!this.active){
            return;
        }
        if (this.listPoints.length <= 1) return;
        this.isAngleOyAtive = true;
        let nextMovePos = new Vec3(this.listPoints[this.currentPos + 1].x, this.listPoints[this.currentPos + 1].y, 0);
        let nextAnglePos = new Vec3(this.listPoints[this.currentPos + 3].x, this.listPoints[this.currentPos + 3].y, 0);
        this.moveToNextPoint(nextAnglePos, nextMovePos);
    }
    
    carArrivedFunc() {
        this.carArrived = true;
        GameManger.instance.checkCompleteLv();
    }

    
    
}


