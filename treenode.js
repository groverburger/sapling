const TreeNodeColors = {
    "default" : [185, 185, 185],
    "green" : [38, 114, 17],
    "blue" : [35, 62, 148],
    "red" : [237, 30, 40],
    "dark" : [0.08,0.08,0.08],
    "highlighter" : [224,215,94],
}

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
        this.text = text || ""
        this.id = CurrentNodeID
        this.children = []
        this.childAnchorPoints = []
        this.arrows = []
        this.spaces = 0
        this.width = 0
        this.childWidth = 0
        this.parent = null
        this.dead = false
        this.color = "default"
        CurrentNodeID += 1
    }

    isHovered()
    {
        return Mouse.x >= this.x-this.textWidth()/2 && Mouse.y >= this.y-this.textHeight()/2 && Mouse.x <= this.x+this.textWidth()/2 && Mouse.y <= this.y+this.textHeight()/2
    }

    isSelected()
    {
        return SelectionList[this.id] === this
    }

    addParent()
    {
        let parent = new TreeNode(this.x,this.y)

        if (this === Trees[0])
        {
            Trees[0] = parent
            AddToSpatialHash(parent.x,parent.y, parent)
        }
        else if(this.parent && !this.parent.dead)
        {
            for (let i=0; i<this.parent.children.length; i++)
            {
                if (this.parent.children[i] === this)
                {
                    this.parent.children[i] = parent
                    parent.parent = this.parent
                    break
                }
            }
        }

        parent.children.push(this)
        parent.color = this.color
        this.parent = parent
        this.recalculate()
    }

    addChild(times)
    {
        this.widthChanged = true
        for (let i=0; i<(times || 1); i++)
        {
            let child = new TreeNode(this.x,this.y)
            this.children.push(child)
            child.parent = this
            child.color = this.color
            child.recalculate()
        }
        AddChange()
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

        this.width = Math.max(total, this.textWidth()+4)

        // update child positions
        for (let i=0; i<this.children.length; i++)
        {
            let child = this.children[i]
            child.lastX = child.x
            child.lastY = child.y
            child.xOff = this.childAnchorPoints[i]
            child.yOff = this.lineHeight()
            child.xStart = this.x
            child.yStart = this.y
            child.x = child.xOff + child.xStart
            child.y = child.yOff + child.yStart

            RemoveFromSpatialHash(child.lastX,child.lastY, child)
            AddToSpatialHash(child.x,child.y, child)
        }

        if (this.parent)
            this.parent.recalculate()

        ScreenRefresh()
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
        return Math.max(textWidth(this.text) + 10, 45)
    }

    textHeight()
    {
        return FontSize+6
    }

    lineHeight()
    {
        return 45
    }

    totalHeight()
    {
        let biggestHeight = 0
        for (let i=0; i<this.children.length; i++)
        {
            biggestHeight = Math.max(biggestHeight, this.children[i].totalHeight() + this.lineHeight())
        }

        for (let i=0; i<this.arrows.length; i++)
        {
            let arrow = this.arrows[i]
            biggestHeight = Math.max(biggestHeight, arrow.height+8)
        }

        return biggestHeight
    }

    keyTyped(text)
    {
        this.text = this.text + text
        this.recalculate()
        TreeHasChanged = true

        if (text == " ")
            this.spaces += 1
    }

    keyPressed(keyCode)
    {
        if (keyCode === 8)
        {
            if (ModifierKey())
            {
                this.text = ""
                AddChange()
            }
            else
            {
                this.text = this.text.slice(0,-1)
                TreeHasChanged = true
            }

            this.countSpaces()
            this.recalculate()
        }

        if (keyCode === 65 && ModifierKey())
        {
            this.addChild()
            this.recalculate()
        }

        if (keyCode === 46)
        {
            this.delete()
            NextSelectionList[this.id] = null
            AddChange()

            if (this.parent)
            {
                NextSelectionList[this.parent.id] = this.parent
            }
        }

        // TODO when holding shift, move this node
        if (keyIsDown(16))
        {
            if (keyCode == 37)
            {
                this.moveLeft()
            }

            if (keyCode == 38)
            {
                this.moveUp()
            }

            if (keyCode == 39)
            {
                this.moveRight()
            }
        }
        else
        {
            if (keyCode == 37)
                this.selectSiblingInDirection(-1)
            if (keyCode == 39)
                this.selectSiblingInDirection(1)
            if (keyCode == 38 && this.parent)
            {
                NextSelectionList[this.parent.id] = this.parent
                NextSelectionList[this.id] = null
                AttemptAddChange()
                ScreenRefresh()
            }
            if (keyCode == 40 && this.children.length > 0)
            {
                NextSelectionList[this.id] = null
                let i = Math.floor(this.children.length/2)
                NextSelectionList[this.children[i].id] = this.children[i]
                AttemptAddChange()
                ScreenRefresh()
            }
        }

        /*
        if (keyCode == 86 && ModifierKey())
        {
            print(navigator.clipboard.readText())
        }
        */

        // cycle through things with shift
        if (keyCode == 9)
        {
            if (keyIsDown(16))
            {
                if (!this.selectSiblingInDirection(-1) && this.children.length > 0)
                {
                    NextSelectionList[this.id] = null
                    NextSelectionList[this.children[this.children.length-1].id] = this.children[this.children.length-1]
                    ScreenRefresh()
                }
            }
            else
            {
                if (!this.selectSiblingInDirection(1) && this.children.length > 0)
                {
                    NextSelectionList[this.id] = null
                    NextSelectionList[this.children[0].id] = this.children[0]
                    ScreenRefresh()
                }
            }
        }
    }

    selectSiblingInDirection(direction)
    {
        if (!SelectionList[this.id] || !this.parent) { return }

        let myIndex = null
        for (let i=0; i<this.parent.children.length; i++)
        {
            if (this.parent.children[i] === this)
            {
                myIndex = i
            }
        }

        AttemptAddChange()

        let sibling = this.parent.children[myIndex+direction]
        if (sibling && !sibling.dead)
        {
            NextSelectionList[this.id] = null
            NextSelectionList[sibling.id] = sibling
            ScreenRefresh()

            return true
        }

        return false
    }

    countSpaces()
    {
        this.spaces = 0
        for (let i=0; i<this.text.length; i++)
        {
            if (this.text[i] == " ")
            {
                this.spaces += 1
            }
        }
    }

    moveUp()
    {
        if (this.parent && this.parent.parent)
        {
            for (let i=0; i<this.parent.children.length; i++)
            {
                if (this.parent.children[i] === this)
                {
                    this.parent.children.splice(i,1)
                    break
                }
            }

            this.parent.recalculate()
            this.parent.parent.children.push(this)
            this.parent = this.parent.parent
            this.recalculate()
            TreeHasChanged = true
        }
    }

    moveLeft()
    {
        if (!this.parent) { return }

        for (let i=1; i<this.parent.children.length; i++)
        {
            if (this.parent.children[i] === this)
            {
                let sibling = this.parent.children[i-1]
                this.parent.children[i-1] = this
                this.parent.children[i] = sibling
                this.recalculate()
                TreeHasChanged = true
                break
            }
        }
    }

    moveRight()
    {
        if (!this.parent) { return }

        for (let i=0; i<this.parent.children.length-1; i++)
        {
            if (this.parent.children[i] === this)
            {
                let sibling = this.parent.children[i+1]
                this.parent.children[i+1] = this
                this.parent.children[i] = sibling
                this.recalculate()
                TreeHasChanged = true
                break
            }
        }
    }

    mousePressed() { }

    draw(drawSelected, xoff,yoff)
    {
        // don't draw selected nodes in the normal draw pass
        // so that their halos can overlap other nodes
        if (this.isSelected() && !drawSelected) { return }

        // override the rendering functions
        // when a render target is specified
        let _fill = fill
        let _noFill = noFill
        let _noStroke = noStroke
        let _stroke = stroke
        let _strokeWeight = strokeWeight
        let _line = line
        let _rect = rect
        let _text = text
        let _textAlign = textAlign
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
        }

        // can be shifted around when rendering to an image
        xoff = xoff || 0
        yoff = yoff || 0
        let dx = this.x + xoff
        let dy = this.y + yoff

        this.updateRelativePosition()

        // draw all of this node's children
        for (const key in this.children)
        {
            let child = this.children[key]
            child.draw(false, xoff,yoff)

            _stroke(0)
            _strokeWeight(2)
            if (child.spaces > 0)
            {
                _line(child.x + xoff - child.textWidth()/2,child.y + yoff - child.textHeight()/2, dx,dy + this.textHeight()/2)
                _line(child.x + xoff + child.textWidth()/2,child.y + yoff - child.textHeight()/2, dx,dy + this.textHeight()/2)
                _line(child.x + xoff + child.textWidth()/2,child.y + yoff - child.textHeight()/2, child.x + xoff - child.textWidth()/2, child.y + yoff - child.textHeight()/2)
            }
            else
            {
                _line(dx,dy + this.textHeight()/2, child.x + xoff,child.y + yoff - child.textHeight()/2)
            }
        }

        // draw the actual node
        _noStroke()
        _fill(TreeNodeColors[this.color][0], TreeNodeColors[this.color][1], TreeNodeColors[this.color][2])
        if (this.text.length > 0 && this.color == "default")
            _fill(0,0,0,0)
        _rect(dx - this.textWidth()/2,dy - this.textHeight()/2, this.textWidth(),this.textHeight())

        // draw the selection halos only if not being rendered to an image
        if (!renderTarget)
        {
            if (this.isSelected())
            {
                _stroke(0,0,0)
                _strokeWeight(4)
                _noFill()
                let rad = 6
                _rect(dx - this.textWidth()/2 - rad,dy - this.textHeight()/2 - rad, this.textWidth() + rad*2, this.textHeight() + rad*2)
            }
            else
            {
                if (this.isHovered())
                {
                    _stroke(0,0,0)
                    _strokeWeight(4)
                    _noFill()
                    _rect(dx - this.textWidth()/2,dy - this.textHeight()/2, this.textWidth(),this.textHeight())
                }
            }
        }

        _noStroke()
        _fill(255)
        if (this.color == "default" || this.color == "highlighter")
            _fill(0)
        _strokeWeight(1)
        _textAlign(CENTER)
        _text(this.text, dx,dy + 6)

        let i = 0
        while (i < this.arrows.length)
        {
            if (this.arrows[i].from === this)// && this.arrows[i].to && !this.arrows[i].to.dead)
                this.arrows[i].draw(xoff,yoff)
            else
                this.arrows.splice(i,1)

            i += 1
        }
    }

    takePicture()
    {
        let pic = createGraphics(this.width, this.totalHeight() + this.textHeight())
        SetCurrentRenderTarget(pic)
        this.draw(true, this.width/2, this.textHeight()/2)
        SetCurrentRenderTarget(null)
        save(pic, "treeImage.png")
    }
}
