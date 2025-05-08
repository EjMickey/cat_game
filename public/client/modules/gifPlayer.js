export class GifPlayer {
    static frame_count=0
    constructor(img, frameWidth, frameHeight, frameCount, x, y, resized_width, resized_height) {
        this.gif_sprite = img

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.currentFrame = 0;
        this.dw = resized_width
        this.dh = resized_height
        this.x = x;
        this.y = y;
    }

    updateFrame() {
        this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }

    getDrawParams() {
        if(this.frameCount%4==0){
            this.updateFrame();
        }
        this.frameCount++;
        return {
            img: this.gif_sprite,
            sx: this.currentFrame * this.frameWidth, // source x
            sy: 0,                                   // source y
            sw: this.frameWidth,
            sh: this.frameHeight,
            dx: this.x,
            dy: this.y,
            dw: this.dw,
            dh: this.dh
        };
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}
