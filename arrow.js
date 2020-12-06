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

    hoveringPointOne()
    {
        let fromx = this.from.x
        let fromy = this.from.y + this.from.textHeight()/2 + 5
        return Distance(Mouse.x,Mouse.y, fromx + this.xoff1, fromy + this.yoff1) <= 20
    }

    hoveringPointTwo()
    {
        let tox = this.to.x
        let toy = this.to.y + this.to.textHeight()/2 + 5
        return Distance(Mouse.x,Mouse.y, tox + this.xoff2, toy + this.yoff2) <= 20
    }

    draw()
    {
        stroke(0)
        strokeWeight(2)
        noFill()

        let tox = Mouse.x
        let toy = Mouse.y
        let fromx = this.from.x
        let fromy = this.from.y + this.from.textHeight()/2 + 5
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

            // allow editing of control points
            if (SelectionList[this.from.id] === this.from)
            {
                line(fromx,fromy, fromx + this.xoff1,fromy + this.yoff1)
                line(tox + this.xoff2,toy + this.yoff2, fromx + this.xoff1,fromy + this.yoff1)
                line(tox + this.xoff2,toy + this.yoff2, tox,toy)

                if (this.hoveringPointOne())
                {
                    fill(0)
                }
                else
                {
                    noFill()
                }

                circle(fromx + this.xoff1, fromy + this.yoff1, 20)

                if (this.hoveringPointTwo())
                {
                    fill(0)
                }
                else
                {
                    noFill()
                }

                circle(tox + this.xoff2, toy + this.yoff2, 20)
            }
        }

        noFill()
        bezier(
            fromx, fromy,
            fromx + this.xoff1, fromy + this.yoff1,
            tox + this.xoff2, toy + this.yoff2,
            tox, toy
        )

        let tx = bezierTangent(fromx, fromx + this.xoff1, tox + this.xoff2, tox, 1)
        let ty = bezierTangent(fromy, fromy + this.yoff1, toy + this.yoff2, toy, 1)
        let angle = atan2(ty,tx)
        let x = bezierPoint(fromx, fromx + this.xoff1, tox + this.xoff2, tox, 1) + cos(angle)*5
        let y = bezierPoint(fromy, fromy + this.yoff1, toy + this.yoff2, toy, 1) + sin(angle)*5

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
        if (this.canDestroy)
            this.to = node
    }
}
