import { _decorator, Component, Graphics, director, Node, Collider2D, Contact2DType, tween, PhysicsSystem2D, easing, UITransform, EventTouch, Vec2, Vec3 } from 'cc';
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
    public moveSpeed = 65;
    public currentPos = 0;
    public currentAngle: number = null;
    public pointCounter: number = 0;
    public maxPointInterval: number = 5;
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

         // Tăng biến đếm điểm
        this.pointCounter++;

        // Nếu đã đủ số điểm cần thêm vào mảng listPoints
        if (this.pointCounter >= this.maxPointInterval) {
            this.listPoints.push(currentPos);

            // Đặt lại biến đếm điểm về 0
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

    angleOy(point1: Vec2, point2: Vec2): number {
        if (!this.isAngleOyAtive) {
            return;
        }
        let deltaY = point2.y - point1.y;
        let deltaX = point2.x - point1.x;
        let angleRad = Math.atan2(deltaY, deltaX);
        let angleDeg = 90 + (angleRad * (180.0 / Math.PI));
        return angleDeg;

    }

    
    moveToNextPoint(nextMovePos: Vec2, nextAnglePos: Vec2) {
        if(!this.active){
            return;
        }
        let movePos = this.listPoints[this.currentPos];
        let anglePos = this.listPoints[this.currentPos];

        let angle = this.angleOy(anglePos, nextAnglePos);
        this.car.setRotationFromEuler(new Vec3(0, 0, angle));;
    
        let distance = Vec2.distance(movePos, nextMovePos);
        let moveTime = distance / this.moveSpeed; // this.moveSpeed là tốc độ di chuyển của xe
    
        tween(this.car)
            .to(moveTime, { position: new Vec3(nextMovePos.x, nextMovePos.y, 0) }, { easing: easing.sineInOut })
            .call(() => {
                // GameManger.instance.completeLv();
                let car = this.car.position;
                let park = this.park.position;
                let distance = Vec2.distance(car, park);
                if(distance <= 25){
                    this.carArrivedFunc();
                    this.isAngleOyAtive = false;
                    this.stopFunc();
                    // this.car.active = false;
                    // this.park.active = false;
                    // this.line.clear();
                }
                // Sau khi di chuyển xong, chuyển sang điểm tiếp theo
                this.currentPos += 1;
                if (this.currentPos < this.listPoints.length - 1) {
                    let nextNextMovePos = this.listPoints[this.currentPos + 1];
                    let nextNextAnglePos = this.listPoints[this.currentPos + 3];
                    this.moveToNextPoint(nextNextMovePos, nextNextAnglePos);
                    
                } else {
                    // Xử lý khi di chuyển hoàn thành
                    this.isAngleOyAtive = false;
                    
                }
            })
            .start();
    }

    carArrivedFunc() {
        this.carArrived = true;
        // Kiểm tra xem cả hai xe đã về đích chưa
        GameManger.instance.checkCompleteLv();
    }

    carMove(){
        if(!this.active){
            return;
        }
        if (this.listPoints.length <= 1) return;
        this.isAngleOyAtive = true;
        let nextMovePos = this.listPoints[this.currentPos + 1];
        let nextAnglePos = this.listPoints[this.currentPos + 3];
        this.moveToNextPoint(nextMovePos, nextAnglePos);
    }
    
}


