# Dossier common
Le dossier `common` contient des libs javascript qui sont autant utilisées par le serveur que par le client.
Le client ayant besoin de *packager* tout le code source, le choix a été fait de mettre ça dans la partie client (dossier `src`).

Cependant, il faut coder de manière à que la lib soit accessible autant par le client que par le serveur.
Ce qui explique les lignes de code telles que : `module.exports = {...};`
