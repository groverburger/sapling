const FontSize = 18
const SubFontSize = 14
const SpatialSize = 200

function preload()
{
    SaplingSprite = loadImage("sapling.png")
    TitleSprite = loadImage("title.png")
    NewSprite = loadImage("new.png")
    LoadSprite = loadImage("open.png")
    CameraSprite = loadImage("camera.png")
    SaveSprite = loadImage("save.png")
    UndoSprite = loadImage("undo.png")
    RedoSprite = loadImage("redo.png")
    NoUndoSprite = loadImage("noundo.png")
    NoRedoSprite = loadImage("noredo.png")
    InfoSprite = loadImage("info.png")
    TipSprite = loadImage("tips.png")
}

function setup()
{
    Canvas = createCanvas()
    Canvas.style("display","block")
    AutoResizeCanvas()
    Reset()
    Tutorial = false
    let treeBackup = getItem("treeBackup")
    if (treeBackup)
    {
        LoadTreeRepresentation(treeBackup)
    }
    else
    {
        Tutorial = true
    }

    if (treeBackup != null && treeBackup.version == undefined) {
CreateInformationDiv(
`<h1>Sapling has been updated!</h1>
Jan 22, 2023 by Alan Munn
<br>
<h3>Subscript notation has been added!</h3>
When you write two underscores in a row __ inside of a node, the text after it becomes a subscript!
It's useful for putting indices on traces.
<br>
<h3>Linebreaks in node text. You can add a linebreak in a node by entering \\ as you type. It will break the node at that point. This is designed so that you can write terminal nodes correctly without a line separating the category and the word/morpheme.  E.g. for a verb node you would type V\\eat.
<h3>Other Things</h3>
<ul>
    <li>Info panel popup should no longer do weird things on Chrome or Safari.</li>
    <li>Clicking the Sapling icon now takes you to the source code repository on Github.</li>
    <li>Cursor movement with the arrow keys is now more intuitive.</li>
</ul>
<br>
Please leave your feedback <a href=https://forms.gle/MDyZWf3bP4wh5fPF6>on this google form</a>!
<br>
`)
    }

    UndoList = []
    UndoIndex = 0
    MostCurrentUndoIndex = 0
    AddChange(true)

    FileInput = createFileInput(function (file) {
        print(file.data)
        LoadTreeRepresentation(file.data)
    })
    FileInput.position(180,90)
    FileInput.size(40,40)
    FileInput.style("font-size", "0px")
    FileInput.style("opacity", "0")

    const tipLink = createA("https://www.paypal.me/groverburger", "Tip the original author!", "_blank")
    tipLink.position(480,90)
    tipLink.size(40,40)
    tipLink.style("opacity", "0")

    const sourceLink = createA("https://github.com/groverburger/sapling", "Github Repo", "_blank")
    sourceLink.position(10,10)
    sourceLink.size(110,110)
    sourceLink.style("opacity", "0")

    MenuBarTooltip = [
        "New Tree",
        "Open Tree",
        "Save Tree",
        "Save Tree as Image",
        "Undo",
        "Redo",
        "Info",
        "Buy me a coffee!",
    ]

    RefreshCount = 0
}

function ScreenRefresh()
{
    ShouldScreenRefresh = true
}

function Reset()
{
    CurrentNodeID = 0
    TreeHasChanged = false
    SpatialHash = {}
    let tree = new TreeNode(0,0, "root")
    AddToSpatialHash(tree.x,tree.y, tree)
    tree.recalculate()
    Trees = [tree]
    Camera = {x:0, y:-50, zoom:1.25}
    CurrentMouseButton = -1
    Mouse = {x:0, y:0}
    PreviousMouseButton = -1
    SelectionList = {}
    NextSelectionList = {}
    ShouldScreenRefresh = true
    MouseHoveringNode = null
    CurrentContextMenu = null
    CurrentRenderTarget = null
    TreeRepresentation = null
    CurrentlyActiveArrows = []
    textSize(FontSize)
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// spatial
////////////////////////////////////////////////////////////////////////////////////////////////////

function GetSpatialString(x,y)
{
    return Math.floor(x/SpatialSize) + ", " + Math.floor(y/SpatialSize)
}

function GetSpatialHash(x,y)
{
    let str = GetSpatialString(x,y)
    if (SpatialHash[str])
        return SpatialHash[str]
}

function AddToSpatialHash(x,y, thing)
{
    let str = GetSpatialString(x,y)
    //console.log(str, SpatialHash[str])
    if (!SpatialHash[str])
        SpatialHash[str] = []
    SpatialHash[str].push(thing)
}

function RemoveFromSpatialHash(x,y, thing)
{
    let str = GetSpatialString(x,y)
    if (!SpatialHash[str])
        return

    let i = 0
    while (i<SpatialHash[str].length)
    {
        if (SpatialHash[str][i] === thing)
        {
            SpatialHash[str].splice(i,1)
            return
        }
        i++
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// api events
////////////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener("contextmenu", function() { arguments[0].preventDefault(); }, false);

document.addEventListener("keydown", function(e) {
    if (e.metaKey || e.ctrlKey)
    {
        if (e.keyCode === 83)
        {
            e.preventDefault()
            SaveFile()
        }

        if (e.keyCode === 65 || e.keyCode === 90)
        {
            e.preventDefault()
        }
    }

    if (e.keyCode === 9)
        e.preventDefault()

}, false);

document.addEventListener("paste", function(event) {
    // cancel original event
    event.preventDefault()

    // get text representation of clipboard
    let text = event.clipboardData.getData("text/utf8");

    for (const key in SelectionList)
    {
        let node = SelectionList[key]
        if (node)
        {
            node.paste(text)
        }
    }
})

/*
document.addEventListener("copy", function(event) {
    // cancel original event
    event.preventDefault()

    // get text representation of clipboard
    let text = event.clipboardData.getData("text/plain");

    for (const key in SelectionList)
    {
        let node = SelectionList[key]
        if (node)
        {
            let textArea = document.createElement("textarea")
            textArea.value = node.text
            textArea.style.position = "fixed"
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            print(document.execCommand("copy"))
            document.body.removeChild(textArea)
        }
    }
})
*/

function SaveFile()
{
    saveJSON(GetTreeRepresentation(Trees[0]), "myTree.json")
}

function windowResized()
{
    AutoResizeCanvas()
    ScreenRefresh()

    if (typeof InformationDiv != "undefined") {
        InformationDiv.position(innerWidth/2 - 200, 32)
    }
}

function AutoResizeCanvas()
{
    resizeCanvas(windowWidth, windowHeight)
}

function mouseWheel(event)
{
    if (typeof InformationDiv != "undefined") return

    let scaleAmount = 1.05

    if (event.delta > 0)
    {
        Camera.zoom /= scaleAmount
        ScreenRefresh()
    }

    if (event.delta < 0)
    {
        Camera.zoom *= scaleAmount
        ScreenRefresh()
    }
}

function keyTyped()
{
    for (const index in SelectionList)
    {
        if (SelectionList[index])
            SelectionList[index].keyTyped(key)
    }
}

function keyPressed()
{
    NextSelectionList = Object.assign({}, SelectionList)

    for (const index in SelectionList)
    {
        if (SelectionList[index])
            SelectionList[index].keyPressed(keyCode)
    }

    SelectionList = NextSelectionList

    if (ModifierKey() || keyIsDown(16))
        AttemptAddChange()

    // apostrophe brings up quick search on firefox, block it here but still send the keyTyped
    if (keyCode == 222)
    {
        keyTyped("'")
        return false
    }

    // backspace and enter
    if (keyCode == 8  || keyCode == 13)
        return false

    // copying
    if (keyCode == 67 && ModifierKey())
        return false

    // z for undo/redo
    if (keyCode == 90 && ModifierKey())
    {
        if (keyIsDown(16))
            RedoChange()
        else
            UndoChange()
    }

    // ctrl - shift - 8 for clearing cache
    if (keyCode == 56 && ModifierKey() && keyIsDown(16))
    {
        clearStorage()
    }
}

function ModifierKey()
{
    return keyIsDown(17) || keyIsDown(18) || keyIsDown(224)
}

function mousePressed()
{
    if (CurrentContextMenu)
        CurrentContextMenu.mousePressed()
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// main loops
////////////////////////////////////////////////////////////////////////////////////////////////////

function draw()
{
    Update()
    Draw()
}

function Update()
{
    if (typeof InformationDiv != "undefined") return

    if (mouseIsPressed)
        CurrentMouseButton = mouseButton
    else
        CurrentMouseButton = -1

    if (CurrentContextMenu)
    {
        CurrentContextMenu.update()
        return
    }

    // update the mouse world coordinates
    let lastMouseX = Mouse.x
    let lastMouseY = Mouse.y
    Mouse.x = Conversion(windowWidth/(-2*Camera.zoom) - Camera.x, windowWidth/(2*Camera.zoom) - Camera.x, 0, windowWidth, mouseX)
    Mouse.y = Conversion(windowHeight/(-2*Camera.zoom) - Camera.y, windowHeight/(2*Camera.zoom) - Camera.y, 0, windowHeight, mouseY)

    // look at all the nodes near spatially to the mouse cursor
    // check if hovering over them
    let lastMouseHoveringNode = MouseHoveringNode
    let clickedANode = false
    let manipulatingArrows = false
    for (let x=-1; x<=1; x++)
    {
        for (let y=-1; y<=1; y++)
        {
            let spatial = GetSpatialHash(Mouse.x + x*SpatialSize,Mouse.y + y*SpatialSize)
            if (spatial)
            {
                for (let i=0; i<spatial.length; i++)
                {
                    let node = spatial[i]
                    if (node.isHovered())
                    {
                        MouseHoveringNode = node
                        if (lastMouseHoveringNode !== MouseHoveringNode)
                            ScreenRefresh()

                        if (CurrentMouseButton === LEFT)
                        {
                            // remove all other nodse from the selection list if not holding shift
                            if (!keyIsDown(16) || true)
                            {
                                SelectionList = {}
                            }

                            // add this node
                            SelectionList[node.id] = node
                            clickedANode = true

                            ScreenRefresh()

                            for (let a=0; a<CurrentlyActiveArrows.length; a++)
                                CurrentlyActiveArrows[a].anchor(node)
                        }

                        // right click to open the context menu
                        if (CurrentMouseButton === RIGHT && PreviousMouseButton === -1)
                        {
                            clickedANode = true
                            let contextData = [
                                ["Add Subnode", [
                                    ["Single", function () { node.addChild(1) }],
                                    ["Double", function () { node.addChild(2) }],
                                    ["Triple", function () { node.addChild(3) }],
                                    ["Quadruple", function () { node.addChild(4) }],
                                    ["Quintuple", function () { node.addChild(5) }],
                                ]],
                                ["Change Color", [
                                    ["Default", function () { node.color = "default"; AddChange() } ],
                                    ["Highlighter", function () { node.color = "highlighter"; AddChange() } ],
                                    ["Blue", function () { node.color = "blue"; AddChange() } ],
                                    ["Red", function () { node.color = "red"; AddChange() } ],
                                    ["Green", function () { node.color = "green"; AddChange() } ],
                                    ["Dark", function () { node.color = "dark"; AddChange() } ],
                                ]],
                                ["Arrows", [
                                    ["Add", function () {
                                        let arrow = new Arrow(node)
                                        node.arrows.push(arrow)
                                        CurrentlyActiveArrows.push(arrow)
                                    }],
                                    ["Remove All", function () {
                                        node.arrows = []
                                        AddChange()
                                    }],
                                ]],
                                ["Reorder", [
                                    ["Left", function () { node.moveLeft(); AttemptAddChange()} ],
                                    ["Right", function () { node.moveRight(); AttemptAddChange()} ],
                                    ["Promote", function () { node.moveUp(); AttemptAddChange() } ],
                                ]],
                                ["Add Parent", function () {
                                    node.addParent()
                                    AddChange()
                                }],
                            ]

                            if (node.parent)
                            {
                                contextData.push(["Delete", function () {
                                    node.delete()
                                    AddChange()
                                }])
                            }

                            if (node.children.length > 0)
                            {
                                contextData.push(["Delete All Subnodes", function () {
                                    while (node.children.length > 0)
                                        node.children[0].delete()

                                    AddChange()
                                }])
                            }

                            CurrentContextMenu = new ContextMenu(mouseX, mouseY, contextData)
                        }
                    }
                }
            }
        }
    }

    for (const nodeid in SelectionList)
    {
        let node = SelectionList[nodeid]

        if (node && node.arrows.length > 0)
        {
            for (let a=0; a<node.arrows.length; a++)
            {
                let arrow = node.arrows[a]
                if (arrow.to)
                {
                    if ((arrow.hoveringPointOne() !== arrow.wasHoveringPointOne)
                    ||  (arrow.hoveringPointTwo() !== arrow.wasHoveringPointTwo))
                    {
                        ScreenRefresh()
                        clickedANode = true
                        manipulatingArrows = true
                    }

                    if (CurrentMouseButton === LEFT)
                    {
                        if (arrow.hoveringPointTwo())
                            arrow.manipulatingP2 = true
                        if (arrow.hoveringPointOne())
                            arrow.manipulatingP1 = true
                    }
                    else
                    {
                        arrow.manipulatingP1 = false
                        arrow.manipulatingP2 = false
                    }

                    if (arrow.manipulatingP2)
                    {
                        arrow.xoff2 = Mouse.x - arrow.to.x
                        arrow.yoff2 = Mouse.y - arrow.to.y - arrow.to.textHeight()/2 - 5
                        manipulatingArrows = true
                        clickedANode = true
                        ScreenRefresh()
                        TreeHasChanged = true
                    }

                    if (arrow.manipulatingP1)
                    {
                        arrow.xoff1 = Mouse.x - arrow.from.x
                        arrow.yoff1 = Mouse.y - arrow.from.y - arrow.to.textHeight()/2 - 5
                        manipulatingArrows = true
                        clickedANode = true
                        ScreenRefresh()
                        TreeHasChanged = true
                    }

                    arrow.wasHoveringPointOne = arrow.hoveringPointOne()
                    arrow.wasHoveringPointTwo = arrow.hoveringPointTwo()
                }
            }
        }
    }

    if (!manipulatingArrows)
        UpdateCamera()

    if (PreviousMouseButton !== LEFT && CurrentMouseButton === LEFT && !clickedANode)
    {
        SelectionList = {}
        ScreenRefresh()
    }

    // to make trivial changes like text additions happen
    if (PreviousMouseButton !== CurrentMouseButton)
        AttemptAddChange()

    let i = 0
    while (i < CurrentlyActiveArrows.length)
    {
        CurrentlyActiveArrows[i].update()
        if (CurrentlyActiveArrows[i].to)
            CurrentlyActiveArrows.splice(i,1)
        else
            i += 1
    }

    // if i was hovering a node but i'm not anymore, refresh the screen
    if (MouseHoveringNode && !MouseHoveringNode.isHovered())
    {
        MouseHoveringNode = null
        ScreenRefresh()
    }

    if (CurrentMouseButton === LEFT && PreviousMouseButton === -1)
    {
        PreviousMouseButton = CurrentMouseButton

        if (InHitbox(mouseX,mouseY, 130,90,40,40))
        {
            //AddChange()
            Reset()
        }

        if (InHitbox(mouseX,mouseY, 130 + 50*2,90,40,40))
            SaveFile()

        if (InHitbox(mouseX,mouseY, 130 + 50*3,90,40,40))
            Trees[0].takePicture()

        if (InHitbox(mouseX,mouseY, 130 + 50*4,90,40,40))
            UndoChange()

        if (InHitbox(mouseX,mouseY, 130 + 50*5,90,40,40))
            RedoChange()

        if (InHitbox(mouseX,mouseY, 130 + 50*6,90,40,40))
        {
CreateInformationDiv(
`<h1>Sapling v3.1</h1>
<br>
Last updated Jan 22, 2023 by Alan Munn
<br>
<br>
Created by Zach B (groverburger) for making syntax trees in Jorge Hankamer's Syntax 1 class, UCSC Fall 2020<br>
<br>
Please leave your feedback <a href=https://forms.gle/MDyZWf3bP4wh5fPF6>on this google form</a>!
<br>
Check out the source code and change log <a href=https://github.com/groverburger/sapling>here</a>!

<h2>How to Use</h2>

Click on a node to select it.<br>
Type to edit text in a selected node.<br>
Right click a node to open the node's options menu.<br>
Click and drag to move the camera, scroll to zoom in and out.<br>
Adding two underscores in a row __ in a node makes everything after it a subscript.<br>
Adding two \\\\ in a row will add a linebreak to a node. This allows you to properly type terminal nodes without a branch between the node label and its word/morpheme. E.g. for a V node you would type V\\\\eat

<h2>Hotkeys</h2>

<ul>
<li>CTRL+Z - Undo</li>
<li>Shift+CTRL+Z - Redo</li>
<li>CTRL+A - Adds a subnode beneath the selected node</li>
<li>Delete - Deletes the currently selected node</li>
<li>CTRL+Backspace - Deletes all text in the currently selected node</li>
<li>Arrow Keys - Move selection around between nodes</li>
<li>Tab - Traverse the tree to the right</li>
<li>Shift+Tab - Traverse the tree to the left</li>
<li>Shift+Arrow Keys - Reorder the currently selected node</li>
</ul>
`)
        }

        /*
        if (InHitbox(mouseX,mouseY, 130 + 50*7,90,40,40))
        {
            window.open("https://www.paypal.me/groverburger", "_blank")
        }
    */
    }

    PreviousMouseButton = CurrentMouseButton

    for (let i=0; i<8; i++)
    {
        if ((InHitbox(mouseX,mouseY, 130 + 50*i,90,40,40) && (movedX || movedY))
        || InHitbox(pmouseX,pmouseY, 130 + 50*i,90,40,40))
        {
            ScreenRefresh()
        }
    }

    if ((InHitbox(mouseX,mouseY, 10,10,110,110) && (movedX || movedY))
    || InHitbox(pmouseX,pmouseY, 10,10,110,110))
    {
        ScreenRefresh()
    }
}

function Draw()
{
    if (!ShouldScreenRefresh) { return }
    ShouldScreenRefresh = false
    RefreshCount++

    background(200,200,200)
    push()
    translate(windowWidth/2, windowHeight/2)
    scale(Camera.zoom)
    translate(Camera.x, Camera.y)

    for (let i=0; i<Trees.length; i++)
    {
        Trees[i].draw()
    }

    for (const key in SelectionList)
    {
        if (SelectionList[key])
            SelectionList[key].draw(true)
    }

    if (Tutorial)
    {
        textAlign(CENTER)
        fill(120)
        text("Right click \"root\" to start!", 0,100)

        textSize(FontSize*3/4)
        text("If you like Sapling, please consider leaving me a tip!", 0,140)
        text("Follow me on Twitter: @grover_burger", 0,155)
        textAlign(LEFT)
        textSize(FontSize)
    }

    pop()

    if (CurrentContextMenu)
        CurrentContextMenu.draw()

    noStroke()
    fill(0)
    textAlign(LEFT)
    //text(Math.floor(Mouse.x) + ", " + Math.floor(Mouse.y), 50,50)
    image(SaplingSprite, 10,10)
    image(NewSprite, 130,90, 40,40)
    image(LoadSprite, 130 + 50,90, 40,40)
    image(SaveSprite, 130 + 50*2,90, 40,40)
    image(CameraSprite, 130 + 50*3,90, 40,40)
    if (UndoIndex > 1)
        image(UndoSprite, 130 + 50*4,90, 40,40)
    else
        image(NoUndoSprite, 130 + 50*4,90, 40,40)

    if (UndoIndex < MostCurrentUndoIndex)
        image(RedoSprite, 130 + 50*5,90, 40,40)
    else
        image(NoRedoSprite, 130 + 50*5,90, 40,40)

    image(InfoSprite, 130 + 50*6,90, 40,40)
    image(TipSprite, 130 + 50*7,90, 40,40)

    image(TitleSprite, 120,30)
    //let rot = RefreshCount*Math.PI*0.1
    //arc(windowWidth-60,50, 30,30, rot,rot+Math.PI*1.5)

    if (typeof InformationDiv != "undefined") return

    if (InHitbox(mouseX,mouseY, 10,10,110,110)) {
        let _text = "View source code and change log"
        noStroke()
        fill(0,0,0, 200)
        rect(mouseX,mouseY, textWidth(_text) + 80,32)
        stroke("white")
        fill("white")
        text(_text, mouseX + 40,mouseY+22)
    }

    for (let i=0; i<8; i++)
    {
        if (InHitbox(mouseX,mouseY, 130 + 50*i,90,40,40))
        {
            noStroke()
            fill(0,0,0, 200)
            rect(mouseX,mouseY, textWidth(MenuBarTooltip[i]) + 80,32)
            stroke("white")
            fill("white")
            text(MenuBarTooltip[i], mouseX + 40,mouseY+22)
        }
    }
}

function UpdateCamera()
{
    if (CurrentMouseButton === LEFT || CurrentMouseButton === CENTER)
    {
        let lastCameraX = Camera.x
        let lastCameraY = Camera.y

        Camera.x += movedX/Camera.zoom
        Camera.y += movedY/Camera.zoom

        if (Camera.x != lastCameraX || Camera.y != lastCameraY)
            ScreenRefresh()
    }
}

function GetCurrentRenderTarget()
{
    return CurrentRenderTarget
}

function SetCurrentRenderTarget(target)
{
    CurrentRenderTarget = target
    if (target)
    {
        target.textSize(FontSize)
    }
}

function Clamp(n, min,max) { return Math.max(Math.min(n, max),min) }
function Lerp(a,b,t) { return (1-t)*a + t*b }
function Conversion(a,b, p1,p2, t) { return Lerp(a,b, Clamp((t-p1)/(p2-p1), 0,1)) }
function Distance(x1,y1, x2,y2) { return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2)) }

function InHitbox(x,y, x1,y1, width,height)
{
    return x >= x1 && x <= x1+width && y >= y1 && y <= y1 + height
}

function CreateInformationDiv(content)
{
    let div = createDiv(content + `<br><br><button style="display: block; margin-left: auto; margin-right: auto; padding: 16px;" onclick="if (InformationDiv) InformationDiv.remove(); InformationDiv = undefined">Done</button>`)
    div.style("position", "fixed")
    div.style("width", "400px")
    div.style("background-color", "white")
    div.style("padding", "24px")
    div.style("font-family", "arial")
    div.position(innerWidth/2 - 200, 32)
    InformationDiv = div
    ScreenRefresh()
}
