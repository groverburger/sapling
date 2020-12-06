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
        this.height = 0
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

    draw(xoff,yoff)
    {
        // override the rendering functions
        // when a render target is specified
        let _fill = fill
        let _noFill = noFill
        let _noStroke = noStroke
        let _triangle = triangle
        let _stroke = stroke
        let _circle = circle
        let _strokeWeight = strokeWeight
        let _line = line
        let _rect = rect
        let _text = text
        let _textAlign = textAlign
        let _bezier = bezier
        let renderTarget = GetCurrentRenderTarget()
        if (renderTarget)
        {
            _fill = renderTarget.fill
            _noFill = renderTarget.noFill
            _noStroke = renderTarget.noStroke
            _stroke = renderTarget.stroke
            _strokeWeight = renderTarget.strokeWeight
            _line = renderTarget.line
            _rect = renderTarget.rect
            _text = renderTarget.text
            _textAlign = renderTarget.textAlign
            _circle = renderTarget.circle
            _bezier = renderTarget.bezier
            _triangle = renderTarget.triangle
        }

        xoff = xoff || 0
        yoff = yoff || 0

        _stroke(0)
        _strokeWeight(2)
        _noFill()

        let tox = Mouse.x + xoff
        let toy = Mouse.y + yoff
        let fromx = this.from.x + xoff
        let fromy = this.from.y + this.from.textHeight()/2 + 5 + yoff
        if (this.to)
        {
            tox = this.to.x + xoff
            toy = this.to.y + this.to.textHeight()/2 + 5 + yoff

            if (this.to.dead)
            {
                this.to = null
                this.from = null
                return
            }

            // allow editing of control points
            if (SelectionList[this.from.id] === this.from)
            {
                _line(fromx,fromy, fromx + this.xoff1,fromy + this.yoff1)
                _line(tox + this.xoff2,toy + this.yoff2, fromx + this.xoff1,fromy + this.yoff1)
                _line(tox + this.xoff2,toy + this.yoff2, tox,toy)

                if (this.hoveringPointOne())
                    _fill(0)
                else
                    _noFill()

                _circle(fromx + this.xoff1, fromy + this.yoff1, 20)

                if (this.hoveringPointTwo())
                    _fill(0)
                else
                    _noFill()

                _circle(tox + this.xoff2, toy + this.yoff2, 20)
            }
        }

        _noFill()
        _bezier(
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

        // sample 20 points to approximate the height of this curve
        this.height = 0
        for (let i=0; i<=20; i++)
        {
            let h = bezierPoint(fromy, fromy + this.yoff1, toy + this.yoff2, toy, i/20) - fromy
            this.height = Math.max(this.height, h)
        }

        _fill(0)
        _noStroke()
        _triangle(x,y, x1,y1, x2,y2)
    }

    anchor(node)
    {
        if (this.canDestroy)
        {
            this.to = node
            AddChange()
        }
    }
}
