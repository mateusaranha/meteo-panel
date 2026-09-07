# MeteoPanel — protótipo

Painel meteorológico estático para consultar **Windy**, **Windguru** e **Climatempo** na mesma página.

## Objetivo do protótipo

- zero backend;
- zero banco de dados;
- sem framework;
- compatível com GitHub Pages;
- configuração dos locais concentrada em `config.js`;
- layout responsivo para desktop e celular;
- cada fonte continua responsável pelos próprios dados.

O local inicial configurado é **Florianópolis, SC**.

## Estrutura

```text
index.html
styles.css
config.js
app.js
README.md
```

## Rodar localmente

Por usar widgets externos, é melhor servir os arquivos por HTTP em vez de abrir `index.html` diretamente pelo Explorador de Arquivos.

Com Python instalado:

```bash
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

## Publicar no GitHub Pages

1. Crie um repositório.
2. Coloque estes arquivos na raiz.
3. Em **Settings → Pages**, escolha a branch principal e a pasta `/ (root)`.
4. Salve.

Não há etapa de build.

## Configuração

Os dados do local ficam em `config.js`:

- coordenadas do Windy;
- ID do spot no Windguru;
- ID/slug da cidade no Climatempo.

O protótipo usa:

- Windguru Florianópolis: spot `105160`;
- Climatempo Florianópolis: cidade `377`.

## Limitações conhecidas do MVP

### Climatempo

O selo oficial é bem compacto. Por isso o dashboard também oferece um link para a previsão completa. Uma próxima versão pode testar outros tamanhos/formatos disponibilizados pelo gerador oficial do Climatempo.

### Windguru

O widget é carregado pelo script oficial do Windguru. Como é conteúdo de terceiro, alterações futuras no widget podem exigir ajuste no dashboard. Há um fallback com link direto para o spot.

### Windy

O mapa é carregado pelo embed oficial e permanece interativo.

## Próximos passos sugeridos

- testar os três widgets em Chrome/Firefox e no celular;
- ajustar dimensões com base no uso real;
- adicionar seletor de locais;
- salvar local favorito em `localStorage`;
- adicionar PWA apenas se fizer sentido;
- criar repositório público depois que o layout básico estiver aprovado.
