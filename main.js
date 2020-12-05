const SpatialSize = 200
let SpatialHash = {}

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
    Trees = []
    let tree = new TreeNode(0,-100)
    AddToSpatialHash(tree.x,tree.y, tree)
    Trees.push(tree)
    /*
    for (let i=0; i<100; i++)
    {
        tree.addChild()
    }
    */

    Camera = {x:0, y:0, zoom:1}
    CurrentMouseButton = -1
    Mouse = {x:0, y:0}
    PreviousMouseButton = -1
    SelectionList = []
    ShouldScreenRefresh = true
    MouseHoveringNode = null
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
}

function ModifierKey()
{
    return keyIsDown(17) || keyIsDown(18) || keyIsDown(224)
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

    UpdateCamera()

    // update the mouse world coordinates
    let lastMouseX = Mouse.x
    let lastMouseY = Mouse.y
    Mouse.x = Conversion(windowWidth/(-2*Camera.zoom) - Camera.x, windowWidth/(2*Camera.zoom) - Camera.x, 0, windowWidth, mouseX)
    Mouse.y = Conversion(windowHeight/(-2*Camera.zoom) - Camera.y, windowHeight/(2*Camera.zoom) - Camera.y, 0, windowHeight, mouseY)

    if (CurrentMouseButton === LEFT)
    {
        // count the amount of things currently being selected
        let amount = 0
        for (const key in SelectionList)
        {
            amount++
        }

        if (amount > 0)
        {
            // don't empty out the selection list when holding shift
            if (!keyIsDown(16))
            {
                SelectionList = {}
            }
            ScreenRefresh()
        }
    }

    // look at all the nodes near spatially to the mouse cursor
    // check if hovering over them
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
                    let lastMouseHoveringNode = MouseHoveringNode
                    if (node.isHovered())
                    {
                        MouseHoveringNode = node
                        if (lastMouseHoveringNode !== MouseHoveringNode)
                            ScreenRefresh()

                        if (CurrentMouseButton === LEFT)
                        {
                            SelectionList[node.id] = node
                        }
                    }
                }
            }
        }
    }

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

    stroke(0)
    fill(0)
    textAlign(LEFT)
    //text(GetSpatialString(Mouse.x,Mouse.y), 50,50)
    //text(str(MouseHoveringNode), 50,100)
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

function Clamp(n, min,max) { return Math.max(Math.min(n, max),min) }
function Lerp(a,b,t) { return (1-t)*a + t*b }
function Conversion(a,b, p1,p2, t) { return Lerp(a,b, Clamp((t-p1)/(p2-p1), 0,1)) }
