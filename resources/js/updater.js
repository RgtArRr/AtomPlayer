function updater (){
  var urlUpdater = "https://gist.githubusercontent.com/RgtArRr/9cb50d8158fda61e820d49d4959bb96a/raw/version.json";
  var currentversion = require('./package.json').version;
  $.get(urlUpdater, function(data){
    var flag = false;
    $.each(data, function(j,k){
      if(j === currentversion || flag){
        $.each(k, function(jj,kk){
          if(kk.type === "add"){
            $.ajax({
              url: "https://raw.githubusercontent.com/RgtArRr/libreta-electron/" + kk.url,
              type:  "GET",
              dataType: kk.dataType,
              processData: false,
              success: function(data){
                fs.writeFileSync(process.resourcesPath + "/app/" + kk.file, data);
              }
            });
          }
          if(kk.type === "remove"){
            fs.unlinkSync(process.resourcesPath + "/app/" + kk.file);
          }
        });
        flag = true;
      }
    });
    if(flag){
      alert("Actualizacion terminada.");
      location.reload();
    }else{
      alert("No hay actualizacion disponible.\n\nVersion " + currentversion + " es la ultima version.");
    }
  }, "json")
  .fail(function() {
    alert("Hubo un error al actualizar, intentalo mas tarde.");
  });
};
