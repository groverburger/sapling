function GetTreeRepresentation(rootNode)
{
    let nodeChildren = {}
    let nodeData = {}
    let nodeArrows = {}
    let register = (node) =>
    {
        // add my personal data
        nodeData[node.id] = {
            text : node.text,
            color : node.color,
            isRoot : !node.parent,
        }

        // add my arrows
        nodeArrows[node.id] = []
        for (let i=0; i<node.arrows.length; i++)
        {
            let arrow = node.arrows[i]
            nodeArrows[node.id].push({
                from : arrow.from.id,
                to : arrow.to.id,
                anchorPoints : [arrow.xoff1, arrow.yoff1, arrow.xoff2, arrow.yoff2],
            })
        }

        // add my children, recursively
        nodeChildren[node.id] = []
        for (const child in node.children)
        {
            register(node.children[child])
            nodeChildren[node.id].push(node.children[child].id)
        }
    }

    register(rootNode)

    return {
        nodeChildren : nodeChildren,
        nodeData : nodeData,
        nodeArrows : nodeArrows,
        maxIndex : CurrentNodeID,
    }
}

function LoadTreeRepresentation(treeRep)
{
    SpatialHash = {}
    let idToNode = {}
    let root = null

    for (const id in treeRep.nodeChildren)
    {
        let data = treeRep.nodeData[id]
        let node = idToNode[id]
        if (!node)
        {
            node = new TreeNode(0,0)
            idToNode[id] = node
            AddToSpatialHash(node.x,node.y, node)
        }

        node.text = data.text
        node.color = data.color
        node.id = id
        node.recalculate()
        node.countSpaces()

        if (data.isRoot)
            root = node

        for (let i=0; i<treeRep.nodeChildren[id].length; i++)
        {
            let childNode = idToNode[treeRep.nodeChildren[id][i]]
            if (!childNode)
            {
                childNode = new TreeNode(0,0)
                AddToSpatialHash(childNode.x,childNode.y, childNode)
                idToNode[treeRep.nodeChildren[id][i]] = childNode
            }

            childNode.parent = node
            node.children.push(childNode)
        }
    }

    root.recalculate()
    Trees[0] = root
    CurrentNodeID = treeRep.maxIndex+1

    for (const id in treeRep.nodeArrows)
    {
        for (let i=0; i<treeRep.nodeArrows[id].length; i++)
        {
            let arrowData = treeRep.nodeArrows[id][i]
            let nodeFrom = idToNode[arrowData.from]
            let nodeTo = idToNode[arrowData.to]
            let arrow = new Arrow(nodeFrom)
            arrow.to = nodeTo
            nodeFrom.arrows.push(arrow)

            arrow.xoff1 = arrowData.anchorPoints[0]
            arrow.yoff1 = arrowData.anchorPoints[1]
            arrow.xoff2 = arrowData.anchorPoints[2]
            arrow.yoff2 = arrowData.anchorPoints[3]
        }
    }
}
