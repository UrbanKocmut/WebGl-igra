var camera, scene, renderer;
var geometry, material, mesh;
var controls;
var fov = 110;
var hunt = false;
var speed = 1200;
var objects = [];
var triggerObjects = [];
var times = [];
var timePlayed = 0;
var z = 0;
var sizeOfMaze = 15;
var duh;
var maxX;
var minX;
var maxZ;
var minZ;
var mx;
var mz;
var ended = false;
var m = 1;
var timerOn = false;
var gameTimer;
var timeSet = false;
var idAnima;

var composer;

var raycaster;


var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var hunting = document.getElementById('hunted');
var deadScreen = document.getElementById('dead');
var wonGame = document.getElementById('won');
var htmlTimer = document.getElementById('timer');
deadScreen.style.display = 'none';
hunting.style.display = 'none';
wonGame.style.display = 'none';

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {

    var element = document.body;

    var pointerlockchange = function (event) {

        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {

            controlsEnabled = true;
            controls.enabled = true;

            blocker.style.display = 'none';

        } else {

            controls.enabled = false;
            if (!ended) {
                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';
                instructions.style.display = '';
            }
        }

    };

    var pointerlockerror = function (event) {
        if (!ended)
            instructions.style.display = '';

    };

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

    instructions.addEventListener('click', function (event) {

        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();

    }, false);

} else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}

init();
animate();

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

function init() {

    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x3f3f3f, 0, 750);

    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    light.shadowCameraVisible = true;
    scene.add(light);


    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    var onKeyDown = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;

        }

    };

    var onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // floor

    geometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
    geometry.rotateX(-Math.PI / 2);

    var textureLoader = new THREE.TextureLoader();
    var stone_wall_texture = textureLoader.load("textures/stone_wall_texture.jpg");
    var floor_texture = textureLoader.load("textures/floor_rock.jpg");
    var start_texture = textureLoader.load("textures/ThreeJsStartTexture.png");
    var go_texture = textureLoader.load("textures/ThreeJsGoTexture.png");
    var exit_texture = textureLoader.load("textures/ExitTexture.png");
    floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(100, 100);
    material = new THREE.MeshPhongMaterial({color: 0xffffff, map: floor_texture});
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // objects

    var boxSize = 35;


    var map = display(maze(sizeOfMaze, sizeOfMaze));

    geometry = new THREE.BoxGeometry(boxSize, boxSize * 3, boxSize);
    stone_wall_texture.wrapS = stone_wall_texture.wrapT = THREE.RepeatWrapping;
    stone_wall_texture.repeat.set(0.5, 1.5);

    //generiramo labirint
    for (var i = 0; i < map.length; i++) {
        // console.log(map[i].length);
        for (var j = 0; j < map[i].length; j++) {
            if (map[i][j] != 0) {
                // console.log(map[i][j]);
                material = new THREE.MeshPhongMaterial({color: 0xffffff, map: stone_wall_texture});
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = (j + 1) * boxSize - boxSize * 3;// odštejemo offset
                mesh.position.y = boxSize / 2;
                mesh.position.z = (i + 1) * boxSize;
                scene.add(mesh);
                objects.push(mesh);
            }

        }
    }
    //ograja okoli spawna
    material = new THREE.MeshPhongMaterial({color: 0xffffff, map: stone_wall_texture});
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            if (i == 4) {// zadnja stena, zapolni vse
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = (j - 1) * boxSize - boxSize; // odštejemo offset
                mesh.position.y = boxSize / 2;
                mesh.position.z = (-i + 1) * boxSize;
                scene.add(mesh);
                objects.push(mesh);
            }
            else if (j == 0 || j == 4) { //stranski steni zapolni samo prvo in zadnjo
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = (j + 1) * boxSize - 3 * boxSize; // odštejemo offset
                mesh.position.y = boxSize / 2;
                mesh.position.z = (-i + 1 ) * boxSize;
                scene.add(mesh);
                objects.push(mesh);
            }
        }

    }

    //duh
    //pomožne funkcije
    var manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };
    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };
    var onError = function (xhr) {
    };
    //nalaganje
    var loader = new THREE.BabylonLoader(manager);
    loader.load('three.js-master/examples/models/babylon/skull.babylon', function (babylonScene) {

        //tule nastaviš pozicijo
        minX = boxSize - 3 * boxSize;
        maxX = map[1].length * boxSize - 3 * boxSize;
        minZ = boxSize;
        maxZ = map.length * boxSize;
        var material = new THREE.MeshPhongMaterial({color: 0xff0000}); // material od duha
        duh = babylonScene.children[1]; //v scene je vla še luč, pa sem zato vzel samo glavo
        duh.material = material;
        duh.scale.x = duh.scale.y = duh.scale.z = 0.6;
        duh.position.x = Math.floor(Math.random() * (maxX - minX)) + minX;
        duh.position.y = 20;
        duh.position.z = Math.floor(Math.random() * (maxZ - minZ)) + minZ;
        duh.name = "ghost"; //potem lahko dobiš duha, da pogledaš v triggerObjects triggerObjects[i].name == "ghost"
        console.log(duh);
        scene.add(duh);
        triggerObjects.push(duh);
    }, onProgress, onError);

    //start tekst
    geometry = new THREE.PlaneGeometry(2 * boxSize, 2 * boxSize, 2 * boxSize, 2 * boxSize);
    material = new THREE.MeshPhongMaterial({color: 0xffffff, map: start_texture, transparent: true, opacity: 1});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -2.3 * boxSize; // offset za tekst
    mesh.position.y = boxSize;
    mesh.rotateZ(-Math.PI / 0.5);
    mesh.name = "startTekst";
    scene.add(mesh);
    triggerObjects.push(mesh);

    //rumen puščica text
    geometry = new THREE.PlaneGeometry(3 * boxSize, 2 * boxSize, 3 * boxSize, 2 * boxSize);
    material = new THREE.MeshPhongMaterial({color: 0xffffff, map: go_texture, transparent: true, opacity: 0.5});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = boxSize;
    mesh.position.y = boxSize;
    mesh.rotateZ(-Math.PI);
    mesh.rotateX(-Math.PI);
    mesh.name = "start";
    scene.add(mesh);
    triggerObjects.push(mesh);

    //exit text
    geometry = new THREE.PlaneGeometry(boxSize, 2 * boxSize, boxSize, 2 * boxSize);
    material = new THREE.MeshPhongMaterial({color: 0xffffff, map: exit_texture, transparent: true, opacity: 0.5});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = boxSize * (map.length - 1);
    mesh.position.x = boxSize * (map.length - 3);
    mesh.position.y = boxSize;
    mesh.rotateZ(-Math.PI);
    mesh.rotateX(-Math.PI);
    mesh.rotateY(Math.PI / 2);
    mesh.name = "exit";
    scene.add(mesh);
    triggerObjects.push(mesh);


    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setFaceCulling( THREE.CullFaceNone );
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    composer = new THREE.EffectComposer( renderer );
    composer.addPass( new THREE.RenderPass( scene, camera ) );

    var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
    effect.uniforms[ 'amount' ].value = 0.001;
    effect.renderToScreen = true;
    composer.addPass( effect );

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth , window.innerHeight );
    composer.setSize( window.innerWidth, window.innerHeight );

}


function animate() {
    if (ended) {
        controls.enabled = false;
    }
    if (timerOn) {
        var current = window.performance.now();
        htmlTimer.innerHTML = "" + Math.floor((current - gameTimer) / 100) / 10 + " s";
    }
    idAnima = requestAnimationFrame(animate);
    if (duh != null) {
        if (hunt) {
            hunting.style.display = '';
        } else {
            hunting.style.display = 'none';
        }
        var max;
        var positionX = controls.getObject().position.x;
        var positionZ = controls.getObject().position.z;
        if (z++ % 240 == 0 && !hunt) {
            z = 1;
            mx = Math.random() * Math.pow(-1, Math.floor(Math.random() * 2) + 1);
            mz = Math.random() * Math.pow(-1, Math.floor(Math.random() * 2) + 1);
            max = (Math.abs(mx) > Math.abs(mz)) ? Math.abs(mx) : Math.abs(mz);
            mx = mx / max;
            mz = mz / max;
        }
        if (Math.sqrt(Math.pow((positionX - duh.position.x), 2) + Math.pow((positionZ - duh.position.z), 2)) < (((maxX - minX) + (maxZ - minZ)) / 10)) {
            hunt = true;
            mx = positionX - duh.position.x;
            mz = positionZ - duh.position.z;
            max = (Math.abs(mx) > Math.abs(mz)) ? Math.abs(mx) : Math.abs(mz);
            mx = mx / max;
            mz = mz / max;
        } else {
            hunt = false;
        }
        duh.lookAt(controls.getObject().position);
        if (duh.position.z < minZ || duh.position.z > maxZ) {
            mz = -mz;
        }
        if (duh.position.x < minX || duh.position.x > maxX) {
            mx = -mx;
        }
        duh.position.z += mz;
        duh.position.x += mx;
    }
    if (controlsEnabled) {

        //smeri žarkov
        var rays = [
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0)
        ];

        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects(objects);

        var prevPos = new THREE.Vector3().copy(controls.getObject().position);

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        if (moveForward) {
            velocity.z -= speed * delta;
        }
        if (moveBackward) {
            velocity.z += speed * delta;
        }
        if (moveLeft) {
            velocity.x -= speed * delta;
        }
        if (moveRight) {
            velocity.x += speed * delta;
        }


        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        var curPos = new THREE.Vector3().copy(controls.getObject().position);

        //preverimo, v kateri smeri smo se zaleteli
        for (var i = 0; i < rays.length; i++) {
            raycaster.ray.direction = rays[i];
            intersections = raycaster.intersectObjects(objects);
            var triggers = raycaster.intersectObjects(triggerObjects);
            if (intersections.length > 0) {
                switch (i) {
                    case 0:
                        controls.getObject().position.z = Math.min(prevPos.z, curPos.z);
                        break;
                    case 1:
                        controls.getObject().position.z = Math.max(prevPos.z, curPos.z);
                        break;
                    case 2:
                        controls.getObject().position.y = Math.min(prevPos.y, curPos.y);
                        break;
                    case 3:
                        controls.getObject().position.y = Math.max(prevPos.y, curPos.y);
                        canJump = true;
                        break;
                    case 4:
                        controls.getObject().position.x = Math.min(prevPos.x, curPos.x);
                        break;
                    case 5:
                        controls.getObject().position.x = Math.max(prevPos.x, curPos.x);
                        break;
                }
            }
            if (triggers.length > 0) {
                for (var j = 0; j < triggers.length; j++) {
                    if (triggers[j].object.name === "start" && !timerOn) {
                        timerOn = true;
                        gameTimer = window.performance.now();
                    }

                    else if (triggers[j].object.name === "exit") {
                        timerOn = false;
                        var currentTime = window.performance.now();
                        timePlayed = Math.round((currentTime - gameTimer) / 10) / 100;
                        ended = true;
                        if (!timeSet)
                            gameEnd();
                        timeSet = true;
                    }

                    else if (triggers[j].object.name === "ghost") {
                        deadScreen.style.display = '';
                        ended = true;
                    }
                }
            }
        }


        if (controls.getObject().position.y < 20) {

            velocity.y = 0;
            controls.getObject().position.y = 20;

            canJump = true;

        }

        prevTime = time;

    }

    renderer.render(scene, camera);
    composer.render();

}


function gameEnd() {
    wonGame.innerHTML = "Congratulations you have beaten the labyrint!" + "<br />" +
        " Your time was " + timePlayed + " s" + "<br />" + "Press F5 to play again";
    wonGame.style.display = '';
    cancelAnimationFrame(idAnima);
}

function maze(x, y) {
    var n = x * y - 1;
    if (n < 0) {
        alert("illegal maze dimensions");
        return;
    }
    var horiz = [];
    for (var j = 0; j < x + 1; j++) horiz[j] = [],
        verti = [];
    for (var j = 0; j < x + 1; j++) verti[j] = [],
        here = [Math.floor(Math.random() * x), Math.floor(Math.random() * y)],
        path = [here],
        unvisited = [];
    for (var j = 0; j < x + 2; j++) {
        unvisited[j] = [];
        for (var k = 0; k < y + 1; k++)
            unvisited[j].push(j > 0 && j < x + 1 && k > 0 && (j != here[0] + 1 || k != here[1] + 1));
    }
    while (0 < n) {
        var potential = [[here[0] + 1, here[1]], [here[0], here[1] + 1],
            [here[0] - 1, here[1]], [here[0], here[1] - 1]];
        var neighbors = [];
        for (var j = 0; j < 4; j++)
            if (unvisited[potential[j][0] + 1][potential[j][1] + 1])
                neighbors.push(potential[j]);
        if (neighbors.length) {
            n = n - 1;
            next = neighbors[Math.floor(Math.random() * neighbors.length)];
            unvisited[next[0] + 1][next[1] + 1] = false;
            if (next[0] == here[0])
                horiz[next[0]][(next[1] + here[1] - 1) / 2] = true;
            else
                verti[(next[0] + here[0] - 1) / 2][next[1]] = true;
            path.push(here = next);
        } else
            here = path.pop();
    }
    return {x: x, y: y, horiz: horiz, verti: verti};
}

function display(m) {
    var text = [];
    for (var j = 0; j < m.x * 2 + 1; j++) {
        var line = [];
        if (0 == j % 2)
            for (var k = 0; k < m.y * 2 + 1; k++)
                if (0 == k % 2)
                    line[k] = 1;
                else if (j > 0 && m.verti[j / 2 - 1][Math.floor(k / 2)])
                    line[k] = 0;
                else
                    line[k] = 1;
        else
            for (var k = 0; k < m.y * 2 + 1; k++)
                if (0 == k % 2)
                    if (k > 0 && m.horiz[(j - 1) / 2][k / 2 - 1])
                        line[k] = 0;
                    else
                        line[k] = 1;
                else
                    line[k] = 0;
        if (0 == j) line[1] = line[2] = line[3] = 0;
        if (m.x * 2 - 1 == j) line[2 * m.y] = 0;
        text.push(line);
    }
    return text;
}