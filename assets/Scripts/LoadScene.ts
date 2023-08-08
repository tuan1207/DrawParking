import { _decorator, AudioClip, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadScene')
export class LoadScene extends Component {
    @property
    sceneName: string = "";
    @property(AudioClip)
    audioClick: AudioClip = null;
    start() {

    }

    update(deltaTime: number) {
        
    }
    onClick(){
        this.audioClick.play();
        director.loadScene(this.sceneName);
    }

    offAudio(){
        
    }

}


