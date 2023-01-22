const TreeNodeColors = {
    "default" : [180, 180, 180],
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

        // climb up the tree, recalculating
        // then go down the tree updating relative positions
        if (this.parent)
        {
            this.parent.recalculate()
        }
        else
        {
            for (let i=0; i<this.children.length; i++)
            {
                this.children[i].updateRelativePosition()
            }
        }

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
        }

        for (let i=0; i<this.children.length; i++)
        {
            this.children[i].updateRelativePosition()
        }
    }

    textWidth()
    {
        let [mainText,subText,longest] = this.getMainTextAndSubText()
        textSize(FontSize)
        // console.log(longest)
        let w1 = textWidth(longest)
        textSize(SubFontSize)
        let w2 = textWidth(subText)
        textSize(FontSize)
        return Math.max(w1 + w2 + 10, 45)
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

        if (text == " ") {
            this.spaces += 1
        }
    }

    keyPressed(keyCode)
    {
        // backspace
        if (keyCode === 8)
        {
            // ctrl-backspace deletes all text in node
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

        // ctrl-a adds a child
        if (keyCode === 65 && ModifierKey())
        {
            this.addChild()
            this.recalculate()
        }

        // delete key
        if (keyCode === 46)
        {
            let index = null
            if (this.parent)
            {
                // try to find sibling to my left
                for (let i=0; i<this.parent.children.length; i++)
                {
                    if (this.parent.children[i] === this)
                    {
                        index = i
                    }
                }
            }

            this.delete()
            NextSelectionList[this.id] = null
            AddChange()
            if (this.parent)
            {
                index = Math.max(index-1, 0)
                let node = this.parent.children[index]
                if (node && !node.dead)
                    NextSelectionList[node.id] = node
                else if (!this.parent.dead)
                    NextSelectionList[this.parent.id] = this.parent
            }
        }

        if (keyIsDown(16))
        {
            // move around this node with arrows keys holding shift

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
            // just move selection around when pressing the arrows keys without shift
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
                let closest = undefined
                let closeness = Infinity
                for (const child of this.children) {
                    let dist = Math.sqrt(Math.pow(this.x - child.x, 2) + Math.pow(this.y - child.y, 2))
                    if (dist < closeness) {
                        closeness = dist
                        closest = child
                    }
                }
                NextSelectionList[this.id] = null
                NextSelectionList[closest.id] = closest
                AttemptAddChange()
                ScreenRefresh()
            }
        }

        // copy
        if (keyCode == 67 && ModifierKey())
        {
            let textArea = document.createElement("textarea")
            textArea.value = this.text
            textArea.style.position = "fixed"
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.body.removeChild(textArea)
        }

        // cycle through things with tab
        // cycle backwards when holding shift
        if (keyCode == 9)
        {
            if (keyIsDown(16))
            {
                if (!this.selectSiblingInDirection(-1))
                {
                    if (this.children.length > 0)
                    {
                        // if i have children, go down
                        NextSelectionList[this.id] = null
                        NextSelectionList[this.children[this.children.length-1].id] = this.children[this.children.length-1]
                        ScreenRefresh()
                    }
                    else if (this.parent)
                    {
                        // otherwise, go up
                        NextSelectionList[this.id] = null
                        NextSelectionList[this.parent.id] = this.parent
                        ScreenRefresh()
                    }
                }
            }
            else
            {
                if (!this.selectSiblingInDirection(1))
                {
                    if (this.children.length > 0)
                    {
                        // if i have children, go down
                        NextSelectionList[this.id] = null
                        NextSelectionList[this.children[0].id] = this.children[0]
                        ScreenRefresh()
                    }
                    else if (this.parent)
                    {
                        // otherwise, go up
                        NextSelectionList[this.id] = null
                        NextSelectionList[this.parent.id] = this.parent
                        ScreenRefresh()
                    }
                }
            }
        }
    }

    selectSiblingInDirection(direction)
    {
        if (!SelectionList[this.id] || !this.parent) { return }

        AttemptAddChange()

        let bestv = Infinity
        let bestn = undefined
        const recursedown = (node, value) => {
            if (value > 0) {
                for (const child of node.children) {
                    let get = recursedown(child, value-1)
                    if (typeof get == "undefined") continue
                    let diff = Math.abs(get.x - this.x)
                    if (direction == 1) {
                        if (get.x > this.x && diff < bestv) {
                            bestv = diff
                            bestn = get
                        }
                    } else {
                        if (get.x < this.x && diff < bestv) {
                            bestv = diff
                            bestn = get
                        }
                    }
                }
            } else {
                return node
            }
            return bestn
        }

        let parent = this.parent
        let count = 1
        while (parent) {
            recursedown(parent, count)
            parent = parent.parent
            count += 1
        }

        if (!bestn) return false

        NextSelectionList[this.id] = null
        NextSelectionList[bestn.id] = bestn
        ScreenRefresh()

        return true
    }

    paste(text)
    {
        this.text = text
        this.countSpaces()
        this.recalculate()
        AddChange()
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
        let _textSize = textSize
        let _textWidth = textWidth
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
            _textSize = renderTarget.textSize
            _textWidth = renderTarget.textWidth
        }

        // can be shifted around when rendering to an image
        xoff = xoff || 0
        yoff = yoff || 0
        let dx = this.x + xoff
        let dy = this.y + yoff

        //this.updateRelativePosition()

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

        let [mainText, subText,longest] = this.getMainTextAndSubText()
        _textSize(FontSize)
        let w1 = _textWidth(longest)
        _textSize(SubFontSize)
        let w2 = _textWidth(subText)
        _textSize(FontSize)

        _text(mainText, dx-w1/10-w2/10, dy + 6)
        _textSize(SubFontSize)
        _text(subText, dx+w1/10-w2/10, dy + 10)

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

    getMainTextAndSubText() {
        let subText = ""
        let mainText = ""
        let sub = false
        let nl = ""
        let lastChar = ""
        let longest = ""
        for (let i=0; i<this.text.length; i++) {
            let char = this.text[i]
            if (sub) {
                subText += char
            } else {
                mainText += nl
                mainText += char
                nl =  ""
            }
            if (char == "\\" && lastChar == "\\" && i < this.text.length-1) {
                nl = '\n'
                mainText = mainText.substring(0, mainText.length-2)
            }
            if (char == "_" && lastChar == "_" && i < this.text.length-1) {
                sub = true
                mainText = mainText.substring(0, mainText.length-2)
            }

            lastChar = char
        }
        let splittext = mainText.split('\n')
        longest = splittext.reduce((a, b) => a.length > b.length ? a : b, '')

        return [mainText, subText,longest]
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
