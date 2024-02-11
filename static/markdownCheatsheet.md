## Comment n'afficher que la valeur la plus récente en fonction du `timestamp` dans un chart
C'est souvent le cas lorsqu'on veut avoir un *live feed* de certaines informations, seule l'actualisation la plus récente nous intéresse.

#### Exemple
Dans un tableau, par exemple, on voudrait n'afficher que la valeur la plus récente.
Seulement si on fait un `Group by - Date Historgram: timestamp`, on se retrouve avec plusieurs valeurs.
En pratique, on se retrouve avec l'ensemble des `interval` (cf. `Date Histogram` *settings*) existants (et ayant des documents si `min doc: 1`) dans la *time window* du dashboard.

Cf. screen 2020-04-22 13-23-25

#### Une solution qui ne fonctionne pas forcement
On pourrait jouer sur le `Relative time` du *chart* et le forcer sur `1h` si on sait que nos documents sont publiés toutes les heures. Mais cela pose problèmes :
- en cas d'arrête du système pendant une ou plusieurs heures, on ne voit plus de données (logique, aucune n'ont été publiée la dernière heure) mais on voudrait voir celle datant d'il y'a 5 heures si c'est la plus récente
- il va y'avoir 2 entrées si l'on publie deux fois cette heure-ci (ce qui arrive lors de redemarrage du *datacubemanager*)

### Solution simple pour un tableau à une seule *query*
Il suffit de changer le `Group by - Date Historgram: timestamp` pour un `Group by - Terms: timestamp`.
Ainsi, on a accès aux options du `Group by - Terms`, notamment: `Top 1, Order by: Term value`.

> Rappel, le `timestamp` est une *date*, qui, lorsque considérée en temps que *term* est un `long` (nombre de milisecondes écoulées depuis 1970-01-01).

On va donc trier les dates par ordre croissant et retournée celle dont la valeur est la plus grande, c'est à dire la plus récente.

cf. screen 2020-04-22 13-14-43

#### Ajouter une règle pour afficher le `timestamp`
Attention, si l'on ne fait rien, le `timestamp` sera afficher en temps que *nombre*, pour changer ça il faut ajouter une règle d'affichage dans les configurations de la *Vizualization*.

cf. screen 2020-04-22 13-33-49

#### Limitations
Attention, il ne faut, tout de fois, pas oublier que si aucune données n'ont été publiées **pendant la time window** selectionnée par le dashboard, on ne pourra rien afficher.

### Solution complexe pour un tableau à plusieurs *query*
Si l'on essaie la solution précédente dans le cas d'un tableau avec plusieurs *query*, ça ne fonctionne pas.
Tout simplement parce que, Grafana a **besoin** d'un `Date Histogram` pour relier les différentes *query* entre elles, puisqu'il s'agit ici d'un `Table Transform: Time series to columns`.

#### Avoir à la fois un `Group by - Date Historgram` et un `Group by - Terms`
La solution est alors de bien effectuer un `Group by - Terms: timestamp` comme précédement afin de ne selectionner qu'un seul `timestamp`, le plus récent.
Mais, de remettre le `Group by - Date Historgram` afin que Grafana puisse fonctionner !

cf. screen 2020-04-22 13-54-23*emphasized text*

```typescript
if (!localStorage.installPrompted) {
  window.addEventListener('beforeinstallprompt', async (promptEvent) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    promptEvent.preventDefault();

    try {
      // 'Add StackEdit to your home screen?');
      promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (err) {
      // Cancel
    }
    localStorage.installPrompted = true;
  });
}
```

| lang | lang |
| :-- | :--|
| `yml` | YAML |

- `yml`: YAML
- `Hello`: Hello
