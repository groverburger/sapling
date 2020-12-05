class TreeNode
{
    constructor(x,y, text)
    {
        this.xStart = x
        this.yStart = y
        this.xOff = 0
        this.yOff = 0
        this.x = x
        this.y = y
        this.lastX = x
        this.lastY = y
        this.text = text || "test"
        this.id = CurrentNodeID
        CurrentNodeID += 1
        this.children = []
        this.childAnchorPoints = []

        this.width = 0
        this.childWidth = 0
        this.parent = null
        this.dead = false
    }

    isHovered()
    {
        return Mouse.x >= this.x-this.textWidth()/2 && Mouse.y >= this.y-this.textHeight()/2 && Mouse.x <= this.x+this.textWidth()/2 && Mouse.y <= this.y+this.textHeight()/2
    }

    isSelected()
    {
        return SelectionList[this.id] === this
    }

    addChild()
    {
        let child = new TreeNode(this.x,this.y)
        this.children.push(child)
        this.widthChanged = true
        child.parent = this
        child.recalculate()
    }

    delete()
    {
        if (!this.parent) { return }

        this.dead = true

        // remove myself from my parent's list of children
        if (!this.parent.dead)
        {
            for (let i=0; i<this.parent.children.length; i++)
            {
                if (this.parent.children[i] === this)
                {
                    this.parent.children.splice(i,1)
                    this.parent.recalculate()
                }
            }
        }

        RemoveFromSpatialHash(this.x,this.y, this)
        SelectionList[this.id] = null
        ScreenRefresh()

        for (const key in this.children)
        {
            this.children[key].delete()
        }
    }

    update()
    {
        this.recalculate()
        ScreenRefresh()
    }

    recalculate()
    {
        let total = 0
        for (let i=0; i<this.children.length; i++)
        {
            let child = this.children[i]
            let width = child.width
            this.childAnchorPoints[i] = total + width/2
            total = total + width
        }

        for (let i=0; i<this.children.length; i++)
        {
            this.childAnchorPoints[i] = this.childAnchorPoints[i] - total/2
        }

        this.width = Math.max(total, this.textWidth()+2)

        // update child positions
        for (let i=0; i<this.children.length; i++)
        {
            let child = this.children[i]
            child.lastX = child.x
            child.lastY = child.y
            child.xOff = this.childAnchorPoints[i]
            child.yOff = 30
            child.xStart = this.x
            child.yStart = this.y
            child.x = child.xOff + child.xStart
            child.y = child.yOff + child.yStart

            RemoveFromSpatialHash(child.lastX,child.lastY, child)
            AddToSpatialHash(child.x,child.y, child)
        }

        if (this.parent)
            this.parent.recalculate()
    }

    updateRelativePosition()
    {
        if (!this.parent) { return }

        let lastX = this.x
        let lastY = this.y
        this.xStart = this.parent.x
        this.yStart = this.parent.y
        this.x = this.xOff + this.xStart
        this.y = this.yOff + this.yStart

        if (lastX !== this.x || lastY !== this.y)
        {
            RemoveFromSpatialHash(lastX,lastY, this)
            AddToSpatialHash(this.x,this.y, this)
            ScreenRefresh()
        }
    }

    textWidth()
    {
        return Math.max(textWidth(this.text) + 6, 30)
    }

    textHeight()
    {
        return 20
    }

    keyTyped(text)
    {
        this.text = this.text + text
        this.update()
    }

    keyPressed(keyCode)
    {
        if (keyCode === 8)
        {
            if (ModifierKey())
                this.text = ""
            else
                this.text = this.text.slice(0,-1)

            this.update()
        }

        if (keyCode === 65 && ModifierKey())
        {
            this.addChild()
            this.update()
        }

        if (keyCode === 46)
        {
            this.delete()
        }
    }

    mousePressed() { }

    draw(drawSelected)
    {
        // don't draw selected nodes in the normal draw pass
        // so that their halos can overlap other nodes
        if (this.isSelected() && !drawSelected) { return }

        this.updateRelativePosition()

        // draw all of this node's children
        for (const key in this.children)
        {
            let child = this.children[key]
            stroke(0.15*255)
            strokeWeight(1)
            line(this.x,this.y + this.textHeight()/2, child.x,child.y - child.textHeight()/2)
            child.draw()
        }

        // draw the actual node
        noStroke()
        fill(255,255,255)
        rect(this.x - this.textWidth()/2,this.y - this.textHeight()/2, this.textWidth(),this.textHeight())

        // draw the selection halos
        if (this.isSelected())
        {
            stroke(0,0,0)
            strokeWeight(2)
            noFill()
            let rad = 4
            rect(this.x - this.textWidth()/2 - rad,this.y - this.textHeight()/2 - rad, this.textWidth() + rad*2, this.textHeight() + rad*2)
        }
        else
        {
            if (this.isHovered())
            {
                stroke(0,0,0)
                strokeWeight(2)
                noFill()
                rect(this.x - this.textWidth()/2,this.y - this.textHeight()/2, this.textWidth(),this.textHeight())
            }
        }

        noStroke()
        fill(0)
        strokeWeight(1)
        textAlign(CENTER)
        text(this.text, this.x,this.y + 4)
    }
}
