var lyricsHTML = '<div var="tools" style="position: absolute;top: 10px;right: 10px;" id="tools-panel">'+
                    '<img width="20" height="20" title="Corregir lyrics" class="tool" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABNmlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjarY6xSsNQFEDPi6LiUCsEcXB4kygotupgxqQtRRCs1SHJ1qShSmkSXl7VfoSjWwcXd7/AyVFwUPwC/0Bx6uAQIYODCJ7p3MPlcsGo2HWnYZRhEGvVbjrS9Xw5+8QMUwDQCbPUbrUOAOIkjvjB5ysC4HnTrjsN/sZ8mCoNTIDtbpSFICpA/0KnGsQYMIN+qkHcAaY6addAPAClXu4vQCnI/Q0oKdfzQXwAZs/1fDDmADPIfQUwdXSpAWpJOlJnvVMtq5ZlSbubBJE8HmU6GmRyPw4TlSaqo6MukP8HwGK+2G46cq1qWXvr/DOu58vc3o8QgFh6LFpBOFTn3yqMnd/n4sZ4GQ5vYXpStN0ruNmAheuirVahvAX34y/Axk/96FpPYgAAACBjSFJNAAB6JQAAgIMAAPn/AACA6AAAUggAARVYAAA6lwAAF2/XWh+QAAAAkElEQVR42uyVQQrDMAwEd0OPpfj/j+gDQh9lQu+TS1tCiSVDCORggU9ja0ASsgG1wnYbbgJwi906HofcdsgnnRxDMARDMARXEKTbNNuWRwXf7CT8UIkAKqC/UwNxtwDgKanssPJhocTZlwkskh6NK2/b9+jLvMSYvgI2p1OYlOjX5J0+VNslzdEhSMc0yrEOAOsvSuHrkpMXAAAAAElFTkSuQmCC" />'+
                  '</div>'+
                  '<pre var="lyrics" class="text-lyrics">'+
                  '</pre>'+
                  '<div var="search_lyrics" style="background: antiquewhite;margin: 5px;">'+
                    '<form var="formulario">'+
                      '<textarea var="search_input" type="text" style="width: 80%;padding: 3px 0px 3px 10px;"></textarea>'+
                    '</form>'+
                    '<ul var="resultado">'+
                    '</ul>'+
                  '</div>';
function Lyrics(){
  var self = this;
  this.last_idsong;
  this.container = getNodes(lyricsHTML);

  this.draw = function(element){
    this.container.tools.img.element.click(function(){
      if(self.container.lyrics.element.is(":visible")){
        self.container.lyrics.element.hide();
        self.container.search_lyrics.element.show();
      }else{
        self.container.lyrics.element.show();
        self.container.search_lyrics.element.hide();
      }
    });

    this.container.search_lyrics.formulario.element.submit(function(e){
      e.preventDefault();
      self.container.search_lyrics.resultado.element.html("");
      $.get("http://api.lyricsnmusic.com/songs?api_key=af12e83acd3975fdbd0f3d9b93cf4a&q="+this.search_lyrics.formulario.search_input.element.val(), function(data){
        $.each(data, function(j,k){
          var song = $("<li></li>");
          song.html(k.artist.name+ " - "+ k.title);
          song.attr("style", "cursor: pointer; padding: 5px 0px 5px 0px;");
          song.click(function(){
            showLyrics(k.url);
          });
          self.container.search_lyrics.resultado.element.append(song);
        });
      }, "json");
    });

    element.append(this.container.tools.element);
    element.append(this.container.lyrics.element);
    element.append(this.container.search_lyrics.element);
  }

  this.setLyrics = function(text, id_song){
    this.container.lyrics.element.html(text);
    this.last_idsong = id_song;
  }

  this.search_lyrics = function(title, id_song){
    var url_lyrics;
    $.get("http://api.lyricsnmusic.com/songs?api_key=af12e83acd3975fdbd0f3d9b93cf4a&q="+title, function(data){
      if(db.getLyrics(id_song)[0]){
        url_lyrics = db.getLyrics(id_song)[0].values[0][1];
      }else{
        if(data[0]){
          url_lyrics = data[0].url;
        }
      }
      if(url_lyrics){
        $.get(url_lyrics, function(data){
          var page = $(data);
          var lyrics_text = $(page.find("pre")[0]).html();
          if(lyrics){
            self.setLyrics(lyrics_text, id_song);
          }else{
            self.setLyrics("NO SE HA ENCONTRADO.", id_song);
          }
        });
      }else{
        self.setLyrics("NO SE HA ENCONTRADO.", id_song);
      }
    }, "json");
  }
}


function getNodes(src){
  var init = $(src);
  var res = {};
  init.each(function(j,k){
    if($(k).prop("tagName")){
      var attr = {};
      if ($(k).get(0)) {
        var r = $(k).get(0).attributes;
        for (var i in r) {
          var p = r[i];
          if (typeof p.nodeValue !== 'undefined' && p.nodeName !== 'var'){
            attr[p.nodeName] = p.nodeValue;
          }
        }
      }
      var name = $(k).attr("var");
      var etiqueta = $(k).prop("tagName");
      if(!name){
        name = $(k).prop("tagName").toLowerCase();
      }
      var node = $("<" + etiqueta + "></" + etiqueta + ">");
      if (attr) {
        $.each(attr, function(j,k){
          if(j === "html"){
            node.html(k);
            return;
          }
          if(j === "val"){
            node.val(k);
            return;
          }
          node.attr(j, k);
        });
      }
      res[name] = {"element": node};
      $.each(getNodes($(k).html()), function(jj,kk){
        res[name].element.append(kk.element);
        res[name][jj] = kk;
      });
    }
  });
  return res;
}
