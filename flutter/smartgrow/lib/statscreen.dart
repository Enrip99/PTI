import 'statslot.dart';
import 'package:flutter/material.dart';

class StatScreen extends StatelessWidget {
  const StatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
             Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                StatSlot(
                  uri: Uri(
                      scheme: 'http',
                      host: 'nattech.fib.upc.edu',
                      path: '/',
                      port: 40410),
                ),
                StatSlot(
                  uri: Uri(
                      scheme: 'http',
                      host: 'nattech.fib.upc.edu',
                      path: '/',
                      port: 40410),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                StatSlot(
                  uri: Uri(
                      scheme: 'http',
                      host: 'nattech.fib.upc.edu',
                      path: '/',
                      port: 40410),
                ),
                StatSlot(
                  uri: Uri(
                      scheme: 'http',
                      host: 'nattech.fib.upc.edu',
                      path: '/',
                      port: 40410),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(30.0),
              child: ElevatedButton(
                child: const Text('Fetch Stats'),
                onPressed: () {
                  print('Hello');
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
