var canvas = document.getElementById('cvs');
var gui = document.getElementById('gui');
var view = new viewport(canvas);

var main = io();
var server = null;

main.on("server" , function(arg) {
	if(arg != null) {
		server = io(arg);
	}
	else {
		server = main;
	}

	start();
});

function start() {
	server.on("joined", function() {
		console.log("Joined");
	});

	server.emit("join");
}

function doPolygonsIntersect (a, b) {
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        var polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            var i2 = (i1 + 1) % polygon.length;
            var p1 = polygon[i1];
            var p2 = polygon[i2];

            // find the line perpendicular to this edge
            var normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if (minA == null || projected < minA) {
                    minA = projected;
                }
                if (maxA == null || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if (minB == null || projected < minB) {
                    minB = projected;
                }
                if (maxB == null || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
};

var s = window.performance.now();

function hasSeparatingAxis(a, b)
{
    // test each side of a in turn:
    for(i = 0; i < a.side_count; i++)
    {
        normal_x = a.verts[(i+1)%a.side_count].y - a.verts[i].y;
        normal_y = a.verts[i].x - a.verts[(i+1)%a.side_count].x;

        for(j = 0; j < b.side_count; j++)
        {
            dot_product = ((b.vert[j].x - a.verts[i].x) * normal_x) +
                ((b.vert[j].y - a.verts[i].y) * normal_y);
            if(dot_product <= 0.0) // change sign of test based on winding order
                break;
            if(j == b.side_count-1)
                return true; // all dots were +ve, we found a separating axis
        }
   }
   return false;
}

function intersects(a, b)
{
    return !hasSeparatingAxis(a, b) && !hasSeparatingAxis(b, a);
}

for(var i = 0; i < 100; i++) {
	/*var intersect = intersects(
		[{x: 0, y: 5}, {x: 5, y: 0}, {x: 20, y: 15}, {x: 15, y: 20}],
		[{x: 16, y: 21}, {x: 21, y: 16}, {x: 35, y: 25}, {x: 25, y: 35}]
	);*/
}
	

var e = window.performance.now();

console.log("Speed: " + (e - s) + " ms");