class Arrow
{
    constructor(from)
    {
        this.from = from
        this.to = null
        this.xoff1 = 0
        this.yoff1 = 200
        this.xoff2 = 0
        this.yoff2 = 200
        this.canDestroy = false
    }

    update()
    {
        if (!this.to)
        {
            if (movedX !== 0 || movedY !== 0)
            {
                ScreenRefresh()
            }

            if (CurrentMouseButton === -1)
                this.canDestroy = true

            if (CurrentMouseButton !== -1 && this.canDestroy)
            {
                this.from = null
                ScreenRefresh()
            }
        }
    }

    draw()
    {
        let tox = Mouse.x
        let toy = Mouse.y
        if (this.to)
        {
            tox = this.to.x
            toy = this.to.y + this.to.textHeight()/2 + 5

            if (this.to.dead)
            {
                this.to = null
                this.from = null
                return
            }
        }

        stroke(0)
        strokeWeight(2)
        noFill()
        bezier(
            this.from.x, this.from.y + this.from.textHeight()/2,
            this.from.x + this.xoff1, this.from.y + this.yoff1,
            tox + this.xoff2, toy + this.yoff2,
            tox, toy
        )

        let x = bezierPoint(this.from.x, this.from.x + this.xoff1, tox + this.xoff2, tox, 1)
        let y = bezierPoint(this.from.y + this.from.textHeight()/2, this.from.y + this.yoff1, toy + this.yoff2, toy, 1) - 5
        let tx = bezierTangent(this.from.x, this.from.x + this.xoff1, tox + this.xoff2, tox, 1)
        let ty = bezierTangent(this.from.y + this.from.textHeight()/2, this.from.y + this.yoff1, toy + this.yoff2, toy, 1)
        let angle = atan2(ty,tx)

        let size = 16
        let x1 = x + cos(angle + Math.PI*3.7/3)*size
        let y1 = y + sin(angle + Math.PI*3.7/3)*size

        let x2 = x + cos(angle + Math.PI*2.3/3)*size
        let y2 = y + sin(angle + Math.PI*2.3/3)*size

        fill(0)
        noStroke()
        triangle(x,y, x1,y1, x2,y2)
    }

    anchor(node)
    {
        this.to = node
    }
}
