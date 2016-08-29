function updater (){
  var urlUpdater = "https://gist.github.com/RgtArRr/d6c66d7835a2abec85c5380c7fd8e98f/raw/version.json";
  var currentversion = require('./package.json').version;
  $.get(urlUpdater, function(data){
    var flag = false;
    $.each(data, function(j,k){
      if(j === currentversion || flag){
        $.each(k, function(jj,kk){
          if(kk.type === "add"){
            $.ajax({
              url: "https://raw.githubusercontent.com/RgtArRr/AtomPlayer/" + kk.url,
              type:  "GET",
              dataType: kk.dataType,
              processData: false,
              success: function(data){
                fs.writeFileSync(app.getAppPath() + kk.file, data);
              }
            });
          }
          if(kk.type === "remove"){
            fs.unlinkSync(app.getAppPath() + kk.file);
          }
        });
        flag = true;
      }
    });
    if(flag){
      alert("Actualizacion terminada. Reiniciando...");
      //Restart
      setTimeout(function(){
        app.relaunch({args: process.argv.slice(1) + ['--relaunch']});
        app.exit(0);
      }, 3000);
    }else{
      alert("No hay actualizacion disponible.\n\nVersion " + currentversion + " es la ultima version.");
    }
  }, "json")
  .fail(function() {
    alert("Hubo un error al actualizar, intentalo mas tarde. Puede que no tengas internet -.-");
  });
};
