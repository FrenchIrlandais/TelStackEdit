# Tester notre serveur HTTP

#### Retrieve token
```bash
export PORT=4965
curl -XPOST http://localhost:${PORT}/tokens/default -H 'Content-Type: application/json' -d'{"pwd":"joe"}'
curl -XPOST http://localhost:${PORT}/tokens/default -H 'Content-Type: application/json' -d'{"pwd":"applepie"}'
```

#### Use token
```bash
export PORT=4965
export TOKEN=kS8AUsmPEaDP8lhkQv66Q1EExm3xGza2qkbi9VOl7efc0AliOiznruZ
curl -H "Authorization: Bearer ${TOKEN}" http://localhost:${PORT}/repositories/default
```

### Utilitaires
#### Attente synchrone
Fonction d'attente active. A l'aide de **Promise** le retour ne se fait que lorsque la fonction `resolve` est appelée !
```js
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```
