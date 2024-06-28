import { Component, OnInit } from '@angular/core';
import { IonThumbnail, ToastController } from '@ionic/angular';
import { Cliente } from 'src/app/clases/cliente';
import { Mesa } from 'src/app/clases/mesa';
import { BaseDatosService } from 'src/app/servicios/base-datos.service';
import { QrService } from 'src/app/servicios/qr.service';
import { NavController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';

register();
@Component({
  selector: 'app-mesa-cliente',
  templateUrl: './mesa-cliente.page.html',
  styleUrls: ['./mesa-cliente.page.scss'],
})
export class MesaClientePage {

  cliente : Cliente = new Cliente
  mesa : Mesa = new Mesa
  productos:any
  loading:boolean = false;
  mesaVinculada = false
  listadoProductos = false;
  pedido:any;
  estadoPedido:any;
  qrEscaneado:boolean = false;
  noRealizoPedido:boolean = true;

  constructor(public bd : BaseDatosService, private toastController : ToastController, public qr : QrService, private navCtrl: NavController) {
    ///Obtengo la mesa del user logeado pero primero traigo el cliente logeado (corregir cuando se maneje el nuevo log)
    this.loading = true
    let cli = this.bd.Getlog()
    console.log(cli)
    if(cli !== null){
      console.log(cli)
      this.cliente = cli as Cliente
      this.bd.TraerUnaMesaPorNumero(this.cliente.mesa_asignada).then((m) => {
        this.mesa = m

        console.info(this.mesa)
        this.bd.TraerProductos().subscribe((data) => {
          if(data)
            {
              this.productos = data
            }
        })

        this.bd.TraerUnPedidoPorMesa(this.mesa.numero).subscribe((res:any) => {
          if(res.length != 0)
          {
            this.pedido = res[0];
            this.estadoPedido = this.pedido.estado;
            this.noRealizoPedido = false;
            this.qrEscaneado = true;
            this.loading = false
          }
        })

        if(this.mesa.cliente_uid === this.cliente.uid){
          this.presentToast("top","Bienvenido a su mesa","primary")
          this.mesaVinculada = true
          this.loading = false;
        }else{
          this.presentToast("top","Mesa Aun no Vinculada! Escanee su QR","warning")
          this.loading = false;
        }
      })
    }

  }

  async presentToast(position : 'top' | 'middle', message = "", color = "danger"){
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: position,
      color : color,
    });

    await toast.present()
  }

  //Consulta al Mozo, Te redirige al chat general para mandar un mensaje
  ConsultarMozo(){
    this.navCtrl.navigateRoot(["/chat"])
  }

  //Ver encuestas
  VerEncuestas(){
    console.info(this.pedido)
  }

  MostrarProductos(){
    this.listadoProductos = true;
    this.mesaVinculada = false;
  }

  PedidoRecibido()
  {
    this.bd.ModificarEstadoPedido(this.pedido,"recibido")
  }

  PedidoCargado($event:any)
  {
    this.loading = true;
    this.listadoProductos = false;
    this.mesaVinculada = true;
    this.pedido = $event;
    this.bd.TraerPedidoPorUid(this.pedido.uid).subscribe((res) => {
      this.pedido = res;
      this.qrEscaneado = false;
    })
    this.presentToast("middle","Pedido realizado con éxito!. Compruebe el estado de su pedido escaneando el QR","primary")
  }

  // Escan del qr para poder ver la carta y realizar el pedido.
  // Una vez realizado poder ver el estado del pedido...
  async ScanMesa(){
    try{
      await this.qr.StartScan().then((res) => {
        const data = this.qr.scanResult;
        //this.loading = false;
        this.RevisarEstadoPedido(data.content)
      })
      //this.loading = false;
    } catch(error) {
      console.log(error)
    }
  }

  RevisarEstadoPedido(resultado:any)
  {
    if(resultado.toString() == this.mesa.numero.toString())
    {
      if(this.pedido != null)
      {
        this.estadoPedido = this.pedido.estado
      }
      else{
        this.MostrarProductos()
      }
    }
    else{
      this.presentToast("middle","¡No es su mesa asignada!","danger")
    }
  }

}
