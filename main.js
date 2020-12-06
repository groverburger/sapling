const SpatialSize = 200

function setup()
{
    Canvas = createCanvas()
    Canvas.style("display","block")
    AutoResizeCanvas()
    Reset()
    RefreshCount = 0
}

function ScreenRefresh()
{
    ShouldScreenRefresh = true
}

function Reset()
{
    CurrentNodeID = 0
    SpatialHash = {}
    Trees = []
    let tree = new TreeNode(0,0, "root")
    AddToSpatialHash(tree.x,tree.y, tree)
    Trees.push(tree)
    Camera = {x:0, y:-50, zoom:1}
    CurrentMouseButton = -1
    Mouse = {x:0, y:0}
    PreviousMouseButton = -1
    SelectionList = []
    ShouldScreenRefresh = true
    MouseHoveringNode = null
    CurrentContextMenu = null
    CurrentRenderTarget = null
    TreeRepresentation = null
    FontSize = 18
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

function windowResized()
{
    AutoResizeCanvas()
    ScreenRefresh()
}

function AutoResizeCanvas()
{
    resizeCanvas(windowWidth, windowHeight)
}

function mouseWheel(event)
{
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
        SelectionList[index].keyTyped(key)
    }
}

function keyPressed()
{
    for (const index in SelectionList)
    {
        SelectionList[index].keyPressed(keyCode)
    }

    if (keyCode === 8)
        return false

    if (keyCode === 48)
    {
        LoadTreeRepresentation(TreeRepresentation)
    }
}

function ModifierKey()
{
    return keyIsDown(17) || keyIsDown(18) || keyIsDown(224)
}

function mousePressed()
{
    /*
    let amount = 0
    for (const index in SelectionList)
    {
        amount += 1
        SelectionList[index].mousePressed()
    }
    */

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
                            if (!keyIsDown(16))
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
                            CurrentContextMenu = new ContextMenu(mouseX, mouseY, [
                                ["Add Subnode", [
                                    ["Single", function () { node.addChild(1) }],
                                    ["Double", function () { node.addChild(2) }],
                                    ["Triple", function () { node.addChild(3) }],
                                    ["Quadruple", function () { node.addChild(4) }],
                                    ["Quintuple", function () { node.addChild(5) }],
                                ]],
                                ["Change Color", [
                                    ["Highlighter", function () { } ],
                                    ["Blue", function () { } ],
                                    ["Red", function () { } ],
                                    ["Green", function () { } ],
                                    ["Dark", function () { } ],
                                ]],
                                ["Arrows", [
                                    ["Add", function () {
                                        let arrow = new Arrow(node)
                                        node.arrows.push(arrow)
                                        CurrentlyActiveArrows.push(arrow)
                                    }],
                                    ["Remove All", function () { node.arrows = [] }],
                                ]],
                                ["Delete", function () { node.delete() }],
                            ])
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
                    }

                    if (arrow.manipulatingP1)
                    {
                        arrow.xoff1 = Mouse.x - arrow.from.x
                        arrow.yoff1 = Mouse.y - arrow.from.y - arrow.to.textHeight()/2 - 5
                        manipulatingArrows = true
                        clickedANode = true
                        ScreenRefresh()
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

    PreviousMouseButton = CurrentMouseButton
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

    pop()

    if (CurrentContextMenu)
        CurrentContextMenu.draw()

    noStroke()
    fill(0)
    textAlign(LEFT)
    text(Math.floor(Mouse.x) + ", " + Math.floor(Mouse.y), 50,50)
    let rot = RefreshCount*Math.PI*0.1
    arc(windowWidth-60,50, 30,30, rot,rot+Math.PI*1.5)
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
