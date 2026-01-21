**Utilisation & extension


Remplacer les placeholders :
Il te suffit de remplacer les loader.queueImage(...) par tes vrais assets (PNG) et, si tu veux des sons réels, sounds.queue('jump', 'assets/jump.wav') + await sounds.loadAll() puis sounds.play('jump').


Importer un vrai niveau Tiled :

Exporter en JSON (orthogonal).
Marquer les tuiles solides dans le tileset avec la propriété booléenne solid = true.
Créer un object layer avec objets nommés/typés player, enemy, pickup.
Remplacer dans MainScene :
JavaScriptconst tl = new TiledLoader(this.game.loader);const { tilemap, spawns } = await tl.loadFromURL('assets/level1.json');Afficher plus de lignes
Et s’assurer que l’image du tileset (image dans le JSON) est accessible (ou préchargée via loader.queueImage('tiles', '...')).



Caméra :

Proportions (par défaut) : camera.setDeadzoneRatio(x,y,w,h) ; ex: (0.4,0.4,0.2,0.2)
Pixels : camera.setDeadzonePx(200,120,200,160)
Overlay : touche G (voir renderDeadzoneOverlay)



Tir :

Modifie fireCooldown, Projectile (vitesse, durée de vie, dégâts)
Ajoute des armes (ex. shotgun/multiproj) en créant d’autres entités dérivées de Projectile



Collisions :

Les projectiles sont en trigger (ne poussent pas, déclenchent onTrigger)
Les tiles solides sont générées autour des objets chaque frame (performant)