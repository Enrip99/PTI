import 'package:flutter/material.dart';
import 'fetchstat.dart';


class StatSlot extends StatefulWidget {
  const StatSlot({super.key, required this.uri});
  final Uri uri;
  
  @override
  State<StatSlot> createState() => _StatSlotState();
}

class _StatSlotState extends State<StatSlot> {
  late Future<String> futureStat;

  @override
  void initState(){
    super.initState();
    futureStat = fetchStat(widget.uri);
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 150,
      height: 150,
      decoration: BoxDecoration(
        color: Colors.blue,
        border: Border.all(
          width: 5,
          color: Colors.red,
        ),
      ),
      child: Center(
        child: FutureBuilder<String>(
          future: futureStat,
          builder: (context, snapshot) {
              if (snapshot.hasData) {
                return Text(snapshot.data!, style: const TextStyle(fontSize: 10.0));
              } else if (snapshot.hasError) {
                return Text('${snapshot.error}', style: const TextStyle(fontSize: 10.0));
              }

              // By default, show a loading spinner.
              return const CircularProgressIndicator();
          },
        ),
      ),
    );
    }
}