let ContextID = 0

class ContextMenu
{
    constructor(x,y,data)
    {
        this.data = data
        this.x = x
        this.y = y
        this.horizontalMargin = 40
        this.verticalMargin = 0
        this.id = ContextID
        ContextID += 1

        this.width = 0
        for (let i=0; i<data.length; i++)
        {
            let thisText = data[i][0]
            let thisPayload = data[i][1]
            
            let addition = 40
            if (typeof(thisPayload) == "object")
            {
                addition = addition + 12
            }

            this.width = Math.max(this.width, textWidth(thisText) + this.horizontalMargin*2 + addition)
        }
        this.height = this.textHeight()*(this.data.length) + this.verticalMargin*2

        this.subcontexts = {}
        this.isSubcontext = false
        
        ScreenRefresh()
    }

    textHeight()
    {
        return FontSize*1.25
    }

    update()
    {
        let index = this.hoveringIndex()
        if (index !== null && this.data[index])
        {
            if (typeof(this.data[index][1]) == "object" && !this.subcontexts[index])
            {
                this.subcontexts[index] = new ContextMenu(this.x + this.width,this.y + index*this.textHeight(), this.data[index][1])
                this.subcontexts[index].isSubcontext = true
            }
        }

        for (const i in this.subcontexts)
        {
            if (this.subcontexts[i])
            {
                this.subcontexts[i].update()

                if (str(index) !== i && this.subcontexts[i].hoveringIndex() === null)
                    this.subcontexts[i] = null
            }
        }

        // could be more optimized, but it's probably fine
        if (movedX !== 0 || movedY !== 0)
            ScreenRefresh()
    }

    hoveringIndex()
    {
        let mx = mouseX
        let my = mouseY
        if (mx < this.x || mx > this.x + this.width) { return null }
        if (my < this.y+this.verticalMargin || my > this.y + this.height) { return null }

        let i = Math.floor((my - this.y)/this.textHeight())

        if (i >= this.data.length || i < 0) { return null }

        return i
    }

    draw()
    {
        noStroke()
        fill(0,0,0, 200)
        rect(this.x,this.y, this.width,this.height)

        fill(128)
        let index = this.hoveringIndex()
        if (index !== null)
            rect(this.x,this.y+this.verticalMargin+(index)*this.textHeight(), this.width,this.textHeight())

        fill(255)
        noStroke()
        for (let i=0; i<this.data.length; i++)
        {
            text(this.data[i][0], this.x + this.horizontalMargin, this.y + this.verticalMargin*1.5 + this.textHeight()*i + FontSize*0.9)

            if (typeof(this.data[i][1]) == "object")
            {
                let dx = this.x + this.width - 16
                let dy = this.y + this.verticalMargin*1.5 + this.textHeight()*(i+0.5)
                triangle(dx,dy-6, dx+12,dy, dx,dy+6)
            }
        }

        for (const i in this.subcontexts)
        {
            if (this.subcontexts[i])
                this.subcontexts[i].draw()
        }
    }

    mousePressed()
    {
        for (const i in this.subcontexts)
        {
            if (this.subcontexts[i])
                this.subcontexts[i].mousePressed()
        }

        let index = this.hoveringIndex()
        if (index !== null && typeof(this.data[index][1]) == "function")
            this.data[index][1]()

        CurrentContextMenu = null
    }
}
